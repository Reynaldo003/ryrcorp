import { useState, useEffect, useCallback } from "react";

const BASE = "https://crm.grupoautomotrizryr.com";
const POR_PAG = 15;

// ─── Utilidades ───────────────────────────────────────────────
function estrellas(val, max = 5) {
  return Array.from({ length: max }, (_, i) => (
    <span key={i} style={{ color: i < val ? "#d97706" : "#d1d5db", fontSize: 14 }}>★</span>
  ));
}

function formatFecha(str) {
  if (!str) return "";
  const d = new Date(str);
  if (isNaN(d)) return str;
  return d.toLocaleDateString("es-MX", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function extraerMetricas(item) {
  const isServ = item._tipo === "servicio";
  if (isServ) {
    const campos = [
      { icon: "👤", label: "Atención asesor",  key: ["atencion_asesor",  "calificacion_asesor"] },
      { icon: "🔥", label: "Calidad / precio",  key: ["calidad_precio",   "calificacion_precio"] },
      { icon: "🔧", label: "Servicio RyR",       key: ["servicio_ryr",     "calificacion_servicio"] },
    ];
    return campos
      .map(({ icon, label, key }) => {
        const val = key.map((k) => item[k]).find((v) => v !== undefined && v !== null);
        return val !== undefined ? { icon, label, val } : null;
      })
      .filter(Boolean);
  }
  // Satisfacción: intenta claves comunes
  const posibles = [
    { icon: "⭐", label: "Atención",            key: "atencion" },
    { icon: "💰", label: "Precio",               key: "precio" },
    { icon: "🏢", label: "Instalaciones",        key: "instalaciones" },
    { icon: "👍", label: "Recomendación",        key: "recomendacion" },
    { icon: "😊", label: "Satisfacción general", key: "satisfaccion_general" },
  ];
  const encontrados = posibles
    .filter(({ key }) => item[key] !== undefined && typeof item[key] === "number")
    .map(({ icon, label, key }) => ({ icon, label, val: item[key] }));
  if (encontrados.length) return encontrados;

  // Fallback: cualquier clave con "calif" o "preg"
  return Object.entries(item)
    .filter(([k, v]) => (k.startsWith("preg") || k.includes("calif")) && typeof v === "number")
    .map(([k, v]) => ({ icon: "⭐", label: k.replace(/_/g, " "), val: v }));
}

// ─── Tarjeta individual ───────────────────────────────────────
function EncuestaCard({ item }) {
  const [open, setOpen] = useState(false);
  const isServ = item._tipo === "servicio";
  const folio    = item.folio || item.id || "—";
  const cliente  = item.nombre_cliente || item.cliente || "—";
  const asesor   = item.asesor || item.nombre_asesor || "—";
  const agencia  = item.agencia || item.sucursal || "";
  const fecha    = formatFecha(item.fecha || item.created_at || item.fecha_envio);
  const coment   = item.comentarios || item.observaciones || "";
  const metricas = extraerMetricas(item);
  const califs   = metricas.map((m) => m.val);

  const headerBg  = isServ ? "#1a2f1a" : "#1a2540";
  const badgeBg   = isServ ? "#2d5a2d" : "#1c3a5c";
  const badgeColor = isServ ? "#7ed87e" : "#7eb8f7";

  return (
    <div style={{
      border: "0.5px solid #e5e7eb", borderRadius: 12,
      marginBottom: 10, overflow: "hidden", background: "#fff",
    }}>
      {/* Header */}
      <div
        onClick={() => setOpen((o) => !o)}
        style={{
          display: "flex", alignItems: "center", gap: 10,
          padding: "10px 14px", cursor: "pointer",
          background: headerBg, color: "#fff",
        }}
      >
        {/* Folio */}
        <span style={{ fontSize: 13, fontWeight: 500, minWidth: 70 }}>{folio}</span>

        {/* Info */}
        <span style={{ flex: 1, fontSize: 12, color: "rgba(255,255,255,0.65)", display: "flex", gap: 6, flexWrap: "wrap" }}>
          <span style={{ color: "rgba(255,255,255,0.45)" }}>{agencia}</span>
          <span>· {cliente}</span>
          <span>· {asesor}</span>
        </span>

        {/* Badge tipo */}
        <span style={{
          fontSize: 11, fontWeight: 500, padding: "2px 10px",
          borderRadius: 4, textTransform: "uppercase", letterSpacing: "0.04em",
          background: badgeBg, color: badgeColor,
        }}>
          {isServ ? "Servicio" : "Satisfacción"}
        </span>

        {/* Burbujas calificación */}
        <div style={{ display: "flex", gap: 5 }}>
          {califs.map((v, i) => (
            <div key={i} style={{
              width: 24, height: 24, borderRadius: "50%",
              background: badgeBg, color: badgeColor,
              fontSize: 11, fontWeight: 500,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>{v}</div>
          ))}
        </div>

        {/* Fecha */}
        <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", whiteSpace: "nowrap" }}>{fecha}</span>

        {/* Chevron */}
        <span style={{
          fontSize: 14, color: "rgba(255,255,255,0.4)",
          transition: "transform 0.2s", display: "inline-block",
          transform: open ? "rotate(180deg)" : "rotate(0deg)",
        }}>▼</span>
      </div>

      {/* Body */}
      {open && (
        <div style={{ padding: 14 }}>
          {/* Métricas */}
          {metricas.length > 0 && (
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
              gap: 10, marginBottom: 12,
            }}>
              {metricas.map((m, i) => (
                <div key={i} style={{
                  border: "0.5px solid #e5e7eb", borderRadius: 8, padding: "10px 12px",
                }}>
                  <div style={{ fontSize: 11, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>
                    {m.icon} {m.label}
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 500, marginBottom: 4 }}>{m.val}</div>
                  <div>{estrellas(m.val)}</div>
                </div>
              ))}
            </div>
          )}

          {/* Comentarios */}
          <div style={{
            border: "0.5px solid #e5e7eb", borderRadius: 8,
            padding: "10px 12px", background: "#f9fafb",
          }}>
            <div style={{ fontSize: 11, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>
              📝 Comentarios
            </div>
            <div style={{ fontSize: 13, color: "#9ca3af", fontStyle: "italic" }}>
              {coment || "Sin comentarios"}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────
export default function PanelRespuestasEncuestas() {
  const [allData, setAllData]         = useState([]);
  const [filtrados, setFiltrados]     = useState([]);
  const [tab, setTab]                 = useState("todos");
  const [pagina, setPagina]           = useState(1);
  const [texto, setTexto]             = useState("");
  const [agencia, setAgencia]         = useState("");
  const [asesor, setAsesor]           = useState("");
  const [agencias, setAgencias]       = useState([]);
  const [asesores, setAsesores]       = useState([]);
  const [estado, setEstado]           = useState("loading"); // loading | ok | error | empty
  const [errorMsg, setErrorMsg]       = useState("");

  // Carga de datos
  useEffect(() => {
    async function cargar() {
      setEstado("loading");
      try { 
        
        const [resServ, resSat] = await Promise.all([
          fetch(`${BASE}/api/encuestas/servicio/`,    { credentials: "include" }),
          fetch(`${BASE}/api/encuestas/satisfaccion/`, { credentials: "include" }),
        ]);

        let dataServ = [], dataSat = [];

        if (resServ.ok) {
          const json = await resServ.json();
          dataServ = (Array.isArray(json) ? json : json.results ?? json.data ?? [])
            .map((d, i) => ({ ...d, _tipo: "servicio", _idx: `s${i}` }));
        }
        if (resSat.ok) {
          const json = await resSat.json();
          dataSat = (Array.isArray(json) ? json : json.results ?? json.data ?? [])
            .map((d, i) => ({ ...d, _tipo: "satisfaccion", _idx: `a${i}` }));
        }

        if (!resServ.ok && !resSat.ok) {
          setEstado("error");
          setErrorMsg("No se pudo conectar con el servidor. Verifica que estés autenticado.");
          return;
        }

        const combined = [...dataServ, ...dataSat].sort((a, b) => {
          const fa = a.fecha || a.created_at || a.fecha_envio || "";
          const fb = b.fecha || b.created_at || b.fecha_envio || "";
          return fb.localeCompare(fa);
        });

        if (!combined.length) { setEstado("empty"); return; }

        setAllData(combined);
        setAgencias([...new Set(combined.map((d) => d.agencia || d.sucursal || "").filter(Boolean))].sort());
        setAsesores([...new Set(combined.map((d) => d.asesor || d.nombre_asesor || "").filter(Boolean))].sort());
        setEstado("ok");
      } catch (e) {
        setEstado("error");
        setErrorMsg("Error de red: " + e.message);
      }
    }
    cargar();
  }, []);

  // Filtrado reactivo
  useEffect(() => {
    const q = texto.toLowerCase();
    const result = allData.filter((item) => {
      if (tab !== "todos" && item._tipo !== tab) return false;
      if (agencia && (item.agencia || item.sucursal || "") !== agencia) return false;
      if (asesor && (item.asesor || item.nombre_asesor || "") !== asesor) return false;
      if (q) {
        const hay = [item.folio, item.nombre_cliente, item.cliente,
                     item.asesor, item.nombre_asesor, item.agencia, item.sucursal]
          .join(" ").toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
    setFiltrados(result);
    setPagina(1);
  }, [allData, tab, texto, agencia, asesor]);

  const totalPags  = Math.ceil(filtrados.length / POR_PAG);
  const slice      = filtrados.slice((pagina - 1) * POR_PAG, pagina * POR_PAG);
  const numServ    = allData.filter((d) => d._tipo === "servicio").length;
  const numSat     = allData.filter((d) => d._tipo === "satisfaccion").length;

  // ── Estilos compartidos ──
  const tabStyle = (t) => ({
    flex: 1, padding: "8px 0",
    border: "0.5px solid",
    borderColor: tab === t ? "#374151" : "#d1d5db",
    borderRadius: 8, background: tab === t ? "#f3f4f6" : "transparent",
    fontSize: 13, cursor: "pointer",
    color: tab === t ? "#111827" : "#6b7280",
    fontWeight: tab === t ? 500 : 400,
  });

  return (
    <div style={{ padding: "1rem 0", fontFamily: "system-ui, sans-serif" }}>

      {/* ── Estadísticas ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: 20 }}>
        {[
          { label: "Respuestas",    val: allData.length,  color: "#111827", bar: "#1D9E75" },
          { label: "Servicio",      val: numServ,         color: "#1D9E75", bar: "#1D9E75" },
          { label: "Satisfacción",  val: numSat,          color: "#185FA5", bar: "#185FA5" },
        ].map(({ label, val, color, bar }) => (
          <div key={label} style={{ background: "#f3f4f6", borderRadius: 8, padding: "1rem", textAlign: "center" }}>
            <div style={{ fontSize: 28, fontWeight: 500, color, lineHeight: 1.1 }}>{val}</div>
            <div style={{ fontSize: 12, color: "#6b7280", marginTop: 4, textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</div>
            <div style={{ height: 3, borderRadius: 2, background: bar, marginTop: 10 }} />
          </div>
        ))}
      </div>

      {/* ── Tabs ── */}
      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        {[["todos","Todos"],["servicio","Servicio"],["satisfaccion","Satisfacción"]].map(([t, label]) => (
          <button key={t} style={tabStyle(t)} onClick={() => setTab(t)}>{label}</button>
        ))}
      </div>

      {/* ── Filtros ── */}
      <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
        <input
          type="text"
          placeholder="Buscar cliente, asesor, folio..."
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          style={{
            flex: 2, minWidth: 160, fontSize: 13, padding: "6px 10px",
            borderRadius: 8, border: "0.5px solid #d1d5db",
            background: "#fff", color: "#111827",
          }}
        />
        <select
          value={agencia}
          onChange={(e) => setAgencia(e.target.value)}
          style={{ flex: 1, minWidth: 140, fontSize: 13, padding: "6px 10px", borderRadius: 8, border: "0.5px solid #d1d5db" }}
        >
          <option value="">Todas las agencias</option>
          {agencias.map((a) => <option key={a}>{a}</option>)}
        </select>
        <select
          value={asesor}
          onChange={(e) => setAsesor(e.target.value)}
          style={{ flex: 1, minWidth: 140, fontSize: 13, padding: "6px 10px", borderRadius: 8, border: "0.5px solid #d1d5db" }}
        >
          <option value="">Todos los asesores</option>
          {asesores.map((a) => <option key={a}>{a}</option>)}
        </select>
      </div>

      {/* ── Estado ── */}
      {estado === "loading" && (
        <div style={{ padding: "8px 12px", background: "#EAF3DE", color: "#3B6D11", borderRadius: 8, fontSize: 13, marginBottom: 12 }}>
          ⏳ Cargando respuestas...
        </div>
      )}
      {estado === "error" && (
        <div style={{ padding: "8px 12px", background: "#FCEBEB", color: "#A32D2D", borderRadius: 8, fontSize: 13, marginBottom: 12 }}>
          ⚠️ {errorMsg}
        </div>
      )}
      {estado === "empty" && (
        <div style={{ padding: "8px 12px", background: "#f3f4f6", color: "#6b7280", borderRadius: 8, fontSize: 13, marginBottom: 12 }}>
          📭 No hay respuestas registradas aún.
        </div>
      )}
      {estado === "ok" && !filtrados.length && (
        <div style={{ padding: "8px 12px", background: "#f3f4f6", color: "#6b7280", borderRadius: 8, fontSize: 13, marginBottom: 12 }}>
          🔍 Sin resultados para los filtros actuales.
        </div>
      )}

      {/* ── Lista de tarjetas ── */}
      {slice.map((item) => (
        <EncuestaCard key={item._idx} item={item} />
      ))}

      {/* ── Paginación ── */}
      {filtrados.length > POR_PAG && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginTop: 16 }}>
          <button
            disabled={pagina <= 1}
            onClick={() => setPagina((p) => p - 1)}
            style={{
              padding: "5px 14px", border: "0.5px solid #d1d5db", borderRadius: 8,
              background: "transparent", fontSize: 13, cursor: pagina <= 1 ? "default" : "pointer",
              opacity: pagina <= 1 ? 0.35 : 1,
            }}
          >← Anterior</button>
          <span style={{ fontSize: 13, color: "#6b7280" }}>
            Pág. {pagina} de {totalPags} ({filtrados.length} total)
          </span>
          <button
            disabled={pagina >= totalPags}
            onClick={() => setPagina((p) => p + 1)}
            style={{
              padding: "5px 14px", border: "0.5px solid #d1d5db", borderRadius: 8,
              background: "transparent", fontSize: 13, cursor: pagina >= totalPags ? "default" : "pointer",
              opacity: pagina >= totalPags ? 0.35 : 1,
            }}
          >Siguiente →</button>
        </div>
      )}
    </div>
  );
}