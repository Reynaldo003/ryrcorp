import React, { useState, useEffect, useCallback } from "react";

// ── API ───────────────────────────────────────────────────────────────────────
const BASE       = import.meta.env.VITE_API_URL || "https://crm.grupoautomotrizryr.com";
const API_PREFIX = "/digitales";

async function apiFetch(path, opts = {}) {
  const res = await fetch(`${BASE}${API_PREFIX}${path}`, opts);
  if (res.status === 204) return null;
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

// ── Demo cuando no hay backend ────────────────────────────────────────────────
const DEMO = {
  "Polo 2026":    { precio_desde: "$339,990", precio_lista_num: 339990, versiones: { "Trendline": { precio_desde: "$339,990", precio_lista_num: 339990 }, "Highline": { precio_desde: "$389,990", precio_lista_num: 389990 } } },
  "Virtus 2026":  { precio_desde: "$322,490", precio_lista_num: 322490, versiones: { "Trendline": { precio_desde: "$322,490", precio_lista_num: 322490 }, "Comfortline": { precio_desde: "$368,990", precio_lista_num: 368990 } } },
  "Tera 2026":    { precio_desde: "$387,990", precio_lista_num: 387990, versiones: {} },
  "Jetta 2026":   { precio_desde: "$449,290", precio_lista_num: 449290, versiones: { "Trendline": { precio_desde: "$449,290", precio_lista_num: 449290 }, "Comfortline": { precio_desde: "$498,290", precio_lista_num: 498290 }, "Sportline": { precio_desde: "$565,690", precio_lista_num: 565690 } } },
  "Taos 2026":    { precio_desde: "$502,390", precio_lista_num: 502390, versiones: {} },
  "Tiguan 2026":  { precio_desde: "$613,190", precio_lista_num: 613190, versiones: {} },
  "Teramont 2026":{ precio_desde: "$901,190", precio_lista_num: 901190, versiones: {} },
  "GTI 2026":     { precio_desde: "$857,990", precio_lista_num: 857990, versiones: {} },
};

const fmt   = (n) => n ? `$${Number(n).toLocaleString("es-MX")} MXN` : "—";
const delta = (a, b) => (a && b) ? (((b - a) / a) * 100).toFixed(1) : null;

// ── Badge ─────────────────────────────────────────────────────────────────────
function Badge({ color, children }) {
  const cls = {
    red:    "bg-red-50 text-red-700 ring-red-200",
    green:  "bg-emerald-50 text-emerald-700 ring-emerald-200",
    yellow: "bg-amber-50 text-amber-700 ring-amber-200",
    blue:   "bg-blue-50 text-blue-700 ring-blue-200",
    gray:   "bg-slate-100 text-slate-500 ring-slate-200",
    purple: "bg-violet-50 text-violet-700 ring-violet-200",
  };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ring-1 ${cls[color] || cls.gray}`}>
      {children}
    </span>
  );
}

// ── Alerta ────────────────────────────────────────────────────────────────────
function Alerta({ tipo, titulo, msg, onClose }) {
  const s = {
    error:   "bg-red-50 border-red-200 text-red-800",
    warning: "bg-amber-50 border-amber-200 text-amber-800",
    success: "bg-emerald-50 border-emerald-200 text-emerald-800",
    info:    "bg-blue-50 border-blue-200 text-blue-800",
  };
  const icons = { error: "⛔", warning: "⚠️", success: "✅", info: "ℹ️" };
  return (
    <div className={`border rounded-xl px-4 py-3 flex gap-3 items-start ${s[tipo] || s.info}`}>
      <span className="shrink-0 mt-0.5">{icons[tipo]}</span>
      <div className="flex-1 min-w-0">
        {titulo && <p className="text-sm font-semibold">{titulo}</p>}
        {msg    && <p className="text-sm opacity-80 mt-0.5">{msg}</p>}
      </div>
      {onClose && (
        <button onClick={onClose} className="shrink-0 opacity-40 hover:opacity-80 text-xl leading-none">×</button>
      )}
    </div>
  );
}

// ── Fila de versiones expandible ──────────────────────────────────────────────
function FilaVersiones({ versiones }) {
  if (!versiones || Object.keys(versiones).length === 0) return null;
  return (
    <div className="bg-slate-50 border-t border-slate-100 px-4 py-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
        {Object.entries(versiones).map(([nombre, v]) => (
          <div key={nombre} className="flex items-center justify-between bg-white rounded-lg px-3 py-2 border border-slate-200">
            <span className="text-xs font-medium text-slate-600">{nombre}</span>
            <span className="text-xs font-mono font-semibold text-slate-800">{fmt(v.precio_lista_num)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Tabla precios vigentes ────────────────────────────────────────────────────
function TablaActuales({ precios }) {
  const [expandidos, setExpandidos] = useState({});
  const toggle = (modelo) =>
    setExpandidos(p => ({ ...p, [modelo]: !p[modelo] }));

  return (
    <div className="rounded-xl border border-slate-200 overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wide">
            <th className="px-4 py-3 text-left w-8"></th>
            <th className="px-4 py-3 text-left">Modelo</th>
            <th className="px-4 py-3 text-right">Precio desde</th>
            <th className="px-4 py-3 text-right">Precio lista</th>
            <th className="px-4 py-3 text-center">Versiones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {Object.entries(precios).map(([modelo, d]) => {
            const numVersiones = Object.keys(d.versiones || {}).length;
            const abierto = expandidos[modelo];
            return (
              <React.Fragment key={modelo}>
                <tr
                  className={`transition-colors ${abierto ? "bg-blue-50/40" : "hover:bg-slate-50"} ${numVersiones > 0 ? "cursor-pointer" : ""}`}
                  onClick={() => numVersiones > 0 && toggle(modelo)}
                >
                  <td className="px-4 py-3 text-center text-slate-300">
                    {numVersiones > 0 && (
                      <span className={`text-xs transition-transform inline-block ${abierto ? "rotate-90" : ""}`}>▶</span>
                    )}
                  </td>
                  <td className="px-4 py-3 font-semibold text-slate-800">{modelo}</td>
                  <td className="px-4 py-3 text-right text-slate-500">{d.precio_desde || "—"}</td>
                  <td className="px-4 py-3 text-right font-mono font-semibold text-slate-800">{fmt(d.precio_lista_num)}</td>
                  <td className="px-4 py-3 text-center">
                    {numVersiones > 0
                      ? <Badge color="purple">{numVersiones} versiones</Badge>
                      : <Badge color="gray">—</Badge>
                    }
                  </td>
                </tr>
                {abierto && numVersiones > 0 && (
                  <tr>
                    <td colSpan={5} className="p-0">
                      <FilaVersiones versiones={d.versiones} />
                    </td>
                  </tr>
                )}
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ── Tabla comparación con versiones ──────────────────────────────────────────
function TablaComparacion({ snapshot, seleccionados, onToggle, onToggleAll }) {
  const [expandidos, setExpandidos] = useState({});
  const toggle = (m) => setExpandidos(p => ({ ...p, [m]: !p[m] }));

  const modelos   = Object.keys(snapshot.precios_actuales);
  const elegibles = modelos.filter(
    m => snapshot.precios_propuestos[m] && !snapshot.modelos_fallidos?.includes(m)
  );
  const todosOn = elegibles.length > 0 && elegibles.every(m => seleccionados.includes(m));

  return (
    <div className="rounded-xl border border-slate-200 overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wide">
            <th className="px-4 py-3 w-10">
              <input type="checkbox" checked={todosOn} onChange={onToggleAll} className="rounded accent-blue-600" />
            </th>
            <th className="px-4 py-3 w-8"></th>
            <th className="px-4 py-3 text-left">Modelo</th>
            <th className="px-4 py-3 text-right">Actual</th>
            <th className="px-4 py-3 text-right">Nuevo</th>
            <th className="px-4 py-3 text-center">Δ</th>
            <th className="px-4 py-3 text-center">Estado</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {modelos.map((modelo) => {
            const actual  = snapshot.precios_actuales[modelo];
            const nuevo   = snapshot.precios_propuestos[modelo];
            const fallido = snapshot.modelos_fallidos?.includes(modelo);
            const numA    = actual?.precio_lista_num;
            const numN    = nuevo?.precio_lista_num;
            const pct     = delta(numA, numN);
            const subio   = pct !== null && Number(pct) > 0;
            const bajo    = pct !== null && Number(pct) < 0;
            const igual   = pct !== null && Number(pct) === 0;
            const checked = seleccionados.includes(modelo);
            const abierto = expandidos[modelo];

            const verActuales  = Object.keys(actual?.versiones  || {}).length;
            const verNuevas    = Object.keys(nuevo?.versiones   || {}).length;
            const tieneVersiones = verActuales > 0 || verNuevas > 0;

            return (
              <React.Fragment key={modelo}>
                <tr className={`transition-colors ${checked ? "bg-blue-50/60" : "hover:bg-slate-50"} ${fallido ? "opacity-50" : ""}`}>
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={checked}
                      disabled={fallido || !nuevo}
                      onChange={() => onToggle(modelo)}
                      className="rounded accent-blue-600 disabled:opacity-30"
                    />
                  </td>
                  <td
                    className="px-4 py-3 text-center text-slate-300 cursor-pointer"
                    onClick={() => tieneVersiones && toggle(modelo)}
                  >
                    {tieneVersiones && (
                      <span className={`text-xs transition-transform inline-block ${abierto ? "rotate-90" : ""}`}>▶</span>
                    )}
                  </td>
                  <td className="px-4 py-3 font-semibold text-slate-800">{modelo}</td>
                  <td className="px-4 py-3 text-right font-mono text-slate-500">{fmt(numA)}</td>
                  <td className="px-4 py-3 text-right font-mono font-semibold">
                    {fallido
                      ? <span className="text-xs text-slate-400 font-normal">No encontrado</span>
                      : <span className={subio ? "text-red-600" : bajo ? "text-emerald-600" : "text-slate-600"}>{fmt(numN)}</span>
                    }
                  </td>
                  <td className="px-4 py-3 text-center">
                    {pct === null   ? <Badge color="gray">—</Badge>
                    : igual         ? <Badge color="gray">Sin cambio</Badge>
                    : <Badge color={subio ? "red" : "green"}>{subio ? "▲" : "▼"} {Math.abs(pct)}%</Badge>}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {fallido        ? <Badge color="yellow">⚠ Falló</Badge>
                    : igual         ? <Badge color="gray">Igual</Badge>
                    : nuevo         ? <Badge color="blue">Listo</Badge>
                    : <Badge color="yellow">Sin datos</Badge>}
                  </td>
                </tr>
                {abierto && tieneVersiones && (
                  <tr>
                    <td colSpan={7} className="p-0 bg-slate-50">
                      <div className="px-6 py-3 grid grid-cols-1 md:grid-cols-2 gap-4">
                        {verActuales > 0 && (
                          <div>
                            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Versiones actuales</p>
                            <div className="space-y-1">
                              {Object.entries(actual.versiones).map(([nom, v]) => (
                                <div key={nom} className="flex justify-between bg-white rounded px-3 py-1.5 border border-slate-200 text-xs">
                                  <span className="text-slate-600">{nom}</span>
                                  <span className="font-mono font-semibold text-slate-800">{fmt(v.precio_lista_num)}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        {verNuevas > 0 && (
                          <div>
                            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Versiones nuevas</p>
                            <div className="space-y-1">
                              {Object.entries(nuevo.versiones).map(([nom, v]) => {
                                const vActual = actual?.versiones?.[nom]?.precio_lista_num;
                                const vNuevo  = v.precio_lista_num;
                                const cambio  = vActual && vNuevo && vNuevo !== vActual;
                                return (
                                  <div key={nom} className={`flex justify-between rounded px-3 py-1.5 border text-xs ${cambio ? "bg-blue-50 border-blue-200" : "bg-white border-slate-200"}`}>
                                    <span className="text-slate-600">{nom}</span>
                                    <div className="flex items-center gap-2">
                                      {cambio && <span className="text-slate-400 line-through font-mono">{fmt(vActual)}</span>}
                                      <span className={`font-mono font-semibold ${cambio ? "text-blue-700" : "text-slate-800"}`}>{fmt(vNuevo)}</span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ── Página principal ──────────────────────────────────────────────────────────
export default function CatalogoPreciosIndex() {
  const [precios,       setPrecios]       = useState(null);
  const [snapshot,      setSnapshot]      = useState(null);
  const [seleccionados, setSeleccionados] = useState([]);
  const [cargando,      setCargando]      = useState(true);
  const [scrapeando,    setScrapeando]    = useState(false);
  const [aplicando,     setAplicando]     = useState(false);
  const [alerta,        setAlerta]        = useState(null);
  const [vista,         setVista]         = useState("actuales");
  const [modoDemo,      setModoDemo]      = useState(false);

  const cargarPrecios = useCallback(async () => {
    setCargando(true);
    try {
      const d = await apiFetch("/catalogo/precios/");
      if (d?.ok) { setPrecios(d.precios); setModoDemo(false); }
      else throw new Error();
    } catch {
      setPrecios(DEMO);
      setModoDemo(true);
    } finally {
      setCargando(false);
    }
  }, []);

  const cargarSnapshot = useCallback(async () => {
    try {
      const d = await apiFetch("/catalogo/snapshot/ultimo/");
      if (d?.ok && d.snapshot) {
        setSnapshot(d.snapshot);
        const selec = Object.keys(d.snapshot.precios_actuales).filter(m => {
          const a = d.snapshot.precios_actuales[m]?.precio_lista_num;
          const n = d.snapshot.precios_propuestos[m]?.precio_lista_num;
          return n && n !== a;
        });
        setSeleccionados(selec);
        setVista("comparacion");
      }
    } catch { /* sin snapshot */ }
  }, []);

  useEffect(() => { cargarPrecios(); cargarSnapshot(); }, [cargarPrecios, cargarSnapshot]);

  const iniciarScraping = async () => {
    if (modoDemo) {
      setAlerta({ tipo: "warning", titulo: "Sin conexión al backend", msg: `Verifica que Django esté corriendo en ${BASE}.` });
      return;
    }
    setScrapeando(true);
    setAlerta(null);
    try {
      const d = await apiFetch("/catalogo/scraping/iniciar/", { method: "POST" });
      if (!d?.ok) { setAlerta({ tipo: "error", titulo: "Error al iniciar scraping", msg: d?.error }); return; }
      if (!d.scraping_exitoso) {
        setAlerta({ tipo: "warning", titulo: "Scraping falló", msg: d.advertencia || "No se pudieron obtener precios. Los precios actuales se mantienen." });
        return;
      }
      d.modelos_fallidos?.length > 0
        ? setAlerta({ tipo: "warning", titulo: `${d.modelos_fallidos.length} modelo(s) sin datos`, msg: `Sin precio: ${d.modelos_fallidos.join(", ")}. Puedes aplicar los demás.` })
        : setAlerta({ tipo: "success", titulo: "Scraping exitoso", msg: `Precios encontrados para ${d.modelos_encontrados} modelos.` });
      await cargarSnapshot();
    } catch {
      setAlerta({ tipo: "error", titulo: "Error de red", msg: "No se pudo conectar con el servidor." });
    } finally {
      setScrapeando(false);
    }
  };

  const aplicarPrecios = async () => {
    if (!snapshot || seleccionados.length === 0) return;
    setAplicando(true); setAlerta(null);
    try {
      const d = await apiFetch("/catalogo/precios/aplicar/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ snapshot_id: snapshot.id, modelos: seleccionados }),
      });
      if (!d?.ok) { setAlerta({ tipo: "error", titulo: "Error al aplicar", msg: d?.error }); return; }
      setAlerta({ tipo: "success", titulo: "¡Precios actualizados!", msg: `${d.aplicados.length} modelo(s) actualizados. ${d.sin_cambio.length} sin cambio.` });
      setSnapshot(null); setVista("actuales");
      await cargarPrecios();
    } catch {
      setAlerta({ tipo: "error", titulo: "Error de red", msg: "No se pudo aplicar los precios." });
    } finally {
      setAplicando(false);
    }
  };

  const rechazarPrecios = async () => {
    if (!snapshot) return;
    try {
      await apiFetch("/catalogo/precios/rechazar/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ snapshot_id: snapshot.id }),
      });
    } catch { /* silencioso */ }
    setSnapshot(null); setVista("actuales");
    setAlerta({ tipo: "info", titulo: "Cambios descartados", msg: "Los precios actuales se mantienen sin cambios." });
  };

  const toggleModelo = (m) =>
    setSeleccionados(p => p.includes(m) ? p.filter(x => x !== m) : [...p, m]);

  const toggleAll = () => {
    if (!snapshot) return;
    const elegibles = Object.keys(snapshot.precios_actuales)
      .filter(m => snapshot.precios_propuestos[m] && !snapshot.modelos_fallidos?.includes(m));
    const todosOn = elegibles.every(m => seleccionados.includes(m));
    setSeleccionados(todosOn ? [] : elegibles);
  };

  const stats = snapshot ? (() => {
    let subieron = 0, bajaron = 0, iguales = 0;
    const fallidos = snapshot.modelos_fallidos?.length || 0;
    Object.keys(snapshot.precios_actuales).forEach(m => {
      const a = snapshot.precios_actuales[m]?.precio_lista_num;
      const n = snapshot.precios_propuestos[m]?.precio_lista_num;
      if (!n) return;
      if (n > a) subieron++; else if (n < a) bajaron++; else iguales++;
    });
    return { subieron, bajaron, iguales, fallidos };
  })() : null;

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-4">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Catálogo de precios</h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Precios VW para el asistente de WhatsApp · Sincroniza desde vw.com.mx
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {snapshot && (
            <>
              <button
                onClick={() => setVista(v => v === "actuales" ? "comparacion" : "actuales")}
                className="px-3 py-2 text-sm border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600 font-medium transition-colors"
              >
                {vista === "actuales" ? "Ver comparación ↗" : "← Precios vigentes"}
              </button>
              <button
                onClick={rechazarPrecios}
                className="px-3 py-2 text-sm border border-red-200 rounded-lg hover:bg-red-50 text-red-500 font-medium transition-colors"
              >
                Descartar
              </button>
              <button
                onClick={aplicarPrecios}
                disabled={aplicando || seleccionados.length === 0}
                className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg font-semibold transition-colors"
              >
                {aplicando ? "Aplicando…" : `Aplicar${seleccionados.length > 0 ? ` (${seleccionados.length})` : ""}`}
              </button>
            </>
          )}

          <button
            onClick={iniciarScraping}
            disabled={scrapeando}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-slate-900 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg font-semibold transition-colors"
          >
            {scrapeando
              ? <><svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                </svg> Actualizando…</>
              : "🔄 Actualizar precios"
            }
          </button>
        </div>
      </div>

      {/* Modo demo */}
      {modoDemo && (
        <Alerta
          tipo="warning"
          titulo="Sin conexión al backend — mostrando datos de ejemplo"
          msg={`No se pudo conectar a ${BASE}${API_PREFIX}/catalogo/precios/.`}
        />
      )}

      {/* Alerta general */}
      {alerta && <Alerta {...alerta} onClose={() => setAlerta(null)} />}

      {/* Banner snapshot pendiente */}
      {snapshot && vista === "actuales" && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex-1">
            <p className="text-sm font-semibold text-blue-800">📋 Hay precios nuevos pendientes de revisión</p>
            <p className="text-xs text-blue-500 mt-0.5">
              {new Date(snapshot.creado_en).toLocaleString("es-MX")}
              {stats && ` · ▲${stats.subieron} subieron · ▼${stats.bajaron} bajaron · ⚠${stats.fallidos} fallaron`}
            </p>
          </div>
          <button onClick={() => setVista("comparacion")} className="text-sm font-semibold text-blue-700 hover:text-blue-900 underline underline-offset-2 whitespace-nowrap">
            Revisar →
          </button>
        </div>
      )}

      {/* Stats snapshot */}
      {snapshot && vista === "comparacion" && stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Subieron",   val: stats.subieron,  cls: "text-red-500",     bg: "bg-red-50"     },
            { label: "Bajaron",    val: stats.bajaron,   cls: "text-emerald-600", bg: "bg-emerald-50" },
            { label: "Sin cambio", val: stats.iguales,   cls: "text-slate-500",   bg: "bg-slate-50"   },
            { label: "Fallaron",   val: stats.fallidos,  cls: "text-amber-600",   bg: "bg-amber-50"   },
          ].map(({ label, val, cls, bg }) => (
            <div key={label} className={`${bg} rounded-xl p-4 border border-slate-100`}>
              <p className={`text-2xl font-bold ${cls}`}>{val}</p>
              <p className="text-xs text-slate-400 mt-1">{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Alertas extra del snapshot */}
      {snapshot && !snapshot.scraping_exitoso && (
        <Alerta tipo="error" titulo="El scraping falló" msg="No se pudieron obtener precios de vw.com.mx. Los precios actuales no se modificaron." />
      )}
      {snapshot?.scraping_exitoso && snapshot.modelos_fallidos?.length > 0 && (
        <Alerta tipo="warning" titulo={`${snapshot.modelos_fallidos.length} modelo(s) sin precio`} msg={`Aplica los demás y actualiza estos manualmente: ${snapshot.modelos_fallidos.join(", ")}`} />
      )}

      {/* Contenido */}
      {cargando ? (
        <div className="flex items-center justify-center gap-2 py-16 text-slate-400 text-sm">
          <svg className="animate-spin h-5 w-5 text-blue-500" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
          </svg>
          Cargando precios…
        </div>
      ) : vista === "comparacion" && snapshot ? (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-700">Comparación de precios</h2>
            <span className="text-xs text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full">{seleccionados.length} seleccionados</span>
          </div>
          <TablaComparacion
            snapshot={snapshot}
            seleccionados={seleccionados}
            onToggle={toggleModelo}
            onToggleAll={toggleAll}
          />
          <p className="text-xs text-slate-400">* Haz clic en la flecha ▶ para ver las versiones de cada modelo. Solo se aplicarán los modelos marcados.</p>
        </div>
      ) : precios ? (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-700">Precios vigentes en el bot</h2>
            <span className="text-xs text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full">{Object.keys(precios).length} modelos</span>
          </div>
          <TablaActuales precios={precios} />
          <p className="text-xs text-slate-400">
            {modoDemo
              ? "⚠ Datos de ejemplo — conecta el backend para ver precios reales."
              : "Haz clic en ▶ para ver versiones. Presiona \"Actualizar precios\" para sincronizar con vw.com.mx."
            }
          </p>
        </div>
      ) : (
        <div className="py-16 text-center">
          <p className="text-3xl mb-3">📭</p>
          <p className="text-slate-400 text-sm">No se pudieron cargar los precios.</p>
          <button onClick={cargarPrecios} className="mt-4 px-4 py-2 text-sm bg-slate-900 text-white rounded-lg font-semibold hover:bg-slate-700 transition-colors">
            Reintentar
          </button>
        </div>
      )}
    </div>
  );
}