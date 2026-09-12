import { useEffect, useMemo, useState } from "react";
import { Activity, AlertTriangle, BadgeCheck, CalendarDays, Car, CheckCircle2, Clock3, FileText, Gauge, Landmark, Target, TrendingUp, UserCheck, Users } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { getCanalDiario, getCitasStats, getCotizacionesStats, getLineasNegocio, getMotivosDescarte, getPautasOrigen, getSolicitudesFinanciamiento } from "../../lib/apiProspectosDigitales";
import { http } from "../../lib/apiPruebas";

const MESES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
const AGENCIAS = ["VW Córdoba", "VW Orizaba", "VW Poza Rica", "VW Tuxpan", "VW Tuxtepec"];
const COLOR_CANAL = { whatsapp: "#1D2D8A", vw_direct: "#131E5C", facebook: "#253BB3", llamada: "#0C1238", sin_clasificar: "#94A3B8" };
const COLORES_MOTIVOS = ["#0B1B45", "#131E5C", "#1555C7", "#2547A0", "#3B74D4", "#5F92DE", "#7CAEEA", "#9CC8F1"];
const TOOLTIP_STYLE = { borderRadius: 12, border: "1px solid #DCE2EE", boxShadow: "0 8px 24px rgba(19,30,92,.12)", fontSize: 14 };

const VACIO = {
  negocio: null,
  canalDiario: [],
  lineasNegocio: { demanda_total: 0, canales: [], lineas: [] },
  pautas: [],
  motivos: [],
  citas: { citas_concertadas: 0, citas_efectivas: 0, tasa_asistencia: 0 },
  cotizaciones: null,
  solicitudes: null,
};

function buildQuery(params = {}) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") query.set(key, String(value));
  });
  return query.toString();
}

function getNegocioStats(params = {}) {
  const query = buildQuery(params);
  return http(`/digitales/analitica/negocio-stats/${query ? `?${query}` : ""}`);
}

function numero(value) {
  return Number(value ?? 0);
}

function porcentaje(value) {
  return `${numero(value).toLocaleString("es-MX", { maximumFractionDigits: 1 })}%`;
}

function entero(value) {
  return numero(value).toLocaleString("es-MX", { maximumFractionDigits: 0 });
}

function minutos(value) {
  const n = numero(value);
  if (n < 60) return `${n.toLocaleString("es-MX", { maximumFractionDigits: 1 })} min`;
  return `${(n / 60).toLocaleString("es-MX", { maximumFractionDigits: 1 })} h`;
}

function badgeVariacion(value, suffix = "%") {
  const n = numero(value);
  return `${n > 0 ? "+" : ""}${n.toLocaleString("es-MX", { maximumFractionDigits: 1 })}${suffix}`;
}

export default function ProspectosDigitales() {
  const hoy = new Date();
  const añoActual = hoy.getFullYear();
  const mesActual = hoy.getMonth();
  const años = useMemo(() => Array.from({ length: 5 }, (_, i) => añoActual - i), [añoActual]);
  const [añoSel, setAñoSel] = useState(añoActual);
  const [mesSel, setMesSel] = useState(mesActual);
  const [agenciaSel, setAgenciaSel] = useState(null);
  const [data, setData] = useState(VACIO);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let activo = true;
    const params = { anio: añoSel, mes: mesSel + 1, agencia: agenciaSel || undefined };
    setLoading(true);
    setError("");

    Promise.allSettled([
      getNegocioStats(params),
      getCanalDiario(params),
      getLineasNegocio(params),
      getPautasOrigen(params),
      getMotivosDescarte(params),
      getCitasStats(params),
      getCotizacionesStats(params),
      getSolicitudesFinanciamiento(params),
    ]).then((resultados) => {
      if (!activo) return;
      const valor = (index, fallback) => resultados[index]?.status === "fulfilled" ? resultados[index].value : fallback;
      const fallos = resultados.filter((r) => r.status === "rejected");
      const negocio = valor(0, null);
      const canal = valor(1, {});
      const lineas = valor(2, {});
      const pautas = valor(3, {});
      const motivos = valor(4, {});
      const citas = valor(5, {});
      const cotizaciones = valor(6, null);
      const solicitudes = valor(7, null);

      setData({
        negocio,
        canalDiario: Array.isArray(canal?.items) ? canal.items : [],
        lineasNegocio: { demanda_total: numero(lineas?.demanda_total), canales: Array.isArray(lineas?.canales) ? lineas.canales : [], lineas: Array.isArray(lineas?.lineas) ? lineas.lineas : [] },
        pautas: Array.isArray(pautas?.pautas) ? pautas.pautas : [],
        motivos: Array.isArray(motivos?.motivos) ? motivos.motivos : [],
        citas: { citas_concertadas: numero(citas?.citas_concertadas), citas_efectivas: numero(citas?.citas_efectivas), tasa_asistencia: numero(citas?.tasa_asistencia) },
        cotizaciones,
        solicitudes,
      });

      if (fallos.length) {
        console.error("Errores cargando analítica digital:", fallos.map((r) => r.reason));
        setError(`Se cargó el tablero con ${fallos.length} bloque${fallos.length === 1 ? "" : "s"} sin datos. Revisa la consola o el backend.`);
      }
    }).finally(() => { if (activo) setLoading(false); });

    return () => { activo = false; };
  }, [añoSel, mesSel, agenciaSel]);

  const negocio = data.negocio || {};
  const metricas = negocio.metricas || {};
  const respuesta = negocio.respuesta || {};
  const calidad = negocio.calidad || {};
  const oportunidades = negocio.oportunidades || {};
  const comparativo = negocio.comparativo || {};
  const ritmo = negocio.ritmo || {};
  const embudo = Array.isArray(negocio.embudo) ? negocio.embudo : [];
  const canales = Array.isArray(negocio.canales) ? negocio.canales : [];
  const asesores = Array.isArray(negocio.asesores) ? negocio.asesores : [];
  const conversacionesIA = numero(negocio?.actividad_periodo?.conversaciones_ia);
  const topCanal = [...canales].sort((a, b) => numero(b.prospectos) - numero(a.prospectos))[0];
  const topPauta = [...data.pautas].sort((a, b) => numero(b.total) - numero(a.total))[0];
  const topLinea = [...data.lineasNegocio.lineas].sort((a, b) => numero(b.total) - numero(a.total))[0];
  const total = numero(negocio.prospectos);
  const iaPct = total ? (conversacionesIA / total) * 100 : 0;

  return (
    <div className="min-h-screen text-[14px] text-[#1A2344]">
      <main className="space-y-6 px-2 py-4 lg:px-4">
        <Filtros añoSel={añoSel} setAñoSel={setAñoSel} mesSel={mesSel} setMesSel={setMesSel} agenciaSel={agenciaSel} setAgenciaSel={setAgenciaSel} años={años} añoActual={añoActual} mesActual={mesActual} />
        {error && <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 font-semibold text-amber-800">{error}</div>}

        <Seccion titulo="Resumen Ejecutivo">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-6">
            <KpiCard titulo="Prospectos digitales" valor={entero(negocio.prospectos)} loading={loading} badge={badgeVariacion(comparativo.variacion_prospectos)} badgeTone={numero(comparativo.variacion_prospectos) >= 0 ? "green" : "red"} detalle="vs. mes anterior" icono={<Users className="h-5 w-5" />} />
            <KpiCard titulo="Contactados" valor={entero(negocio.contactados)} loading={loading} badge={porcentaje(metricas.tasa_contacto)} detalle="de los prospectos" icono={<UserCheck className="h-5 w-5" />} />
            <KpiCard titulo="Con cita" valor={entero(negocio.citas)} loading={loading} badge={porcentaje(metricas.tasa_cita)} detalle="conversión a cita" icono={<CalendarDays className="h-5 w-5" />} />
            <KpiCard titulo="Cita efectiva" valor={entero(negocio.citas_efectivas)} loading={loading} badge={porcentaje(metricas.tasa_asistencia)} detalle="asistencia de la cohorte" icono={<CheckCircle2 className="h-5 w-5" />} />
            <KpiCard titulo="Cotizados" valor={entero(negocio.cotizaciones)} loading={loading} badge={porcentaje(metricas.tasa_cotizacion_sobre_efectivas)} detalle="sobre citas efectivas" icono={<FileText className="h-5 w-5" />} />
            <KpiCard titulo="Facturados" valor={entero(negocio.facturados)} loading={loading} badge={porcentaje(metricas.tasa_facturacion)} badgeTone="blue" detalle="cierre sobre prospectos" icono={<Car className="h-5 w-5" />} destacado />
          </div>
          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
            <DatoContexto titulo="Conversaciones con IA" valor={`${entero(conversacionesIA)} · ${porcentaje(iaPct)}`} detalle="actividad IA del periodo" />
            <DatoContexto titulo="Canal con mayor volumen" valor={topCanal?.nombre || "Sin datos"} detalle={topCanal ? `${entero(topCanal.prospectos)} prospectos` : ""} />
            <DatoContexto titulo="Pauta líder" valor={topPauta?.nombre || "Sin datos"} detalle={topPauta ? `${entero(topPauta.total)} prospectos · ${porcentaje(topPauta.porcentaje)}` : ""} />
            <DatoContexto titulo="Línea de negocio líder" valor={topLinea?.nombre || "Sin datos"} detalle={topLinea ? `${entero(topLinea.total)} prospectos · ${porcentaje(topLinea.porcentaje)}` : ""} />
          </div>
        </Seccion>

        <Seccion titulo="Embudo Comercial Digital" >
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-[2fr_1fr]">
            <EmbudoComercial etapas={embudo} loading={loading} />
            <Oportunidades data={oportunidades} loading={loading} />
          </div>
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <MiniMetrica titulo="Cotización → solicitud" valor={porcentaje(metricas.tasa_solicitud_sobre_cotizacion)} detalle={`${entero(negocio.solicitudes)} solicitudes`} />
            <MiniMetrica titulo="Aprobación financiera" valor={porcentaje(metricas.tasa_aprobacion)} detalle={`${entero(negocio.aprobadas)} aprobadas`} />
            <MiniMetrica titulo="Cotización → factura" valor={porcentaje(metricas.tasa_cierre_sobre_cotizacion)} detalle={`${entero(negocio.facturados)} cierres`} />
            <MiniMetrica titulo="Factura → entrega" valor={porcentaje(metricas.tasa_entrega)} detalle={`${entero(negocio.entregados)} entregas`} />
          </div>
        </Seccion>

        <Seccion titulo="Velocidad y Atención Comercial">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
            <KpiCompacto titulo="Mediana 1ª respuesta" valor={minutos(respuesta.mediana_min)} detalle={`P90: ${minutos(respuesta.p90_min)}`} icono={<Clock3 className="h-5 w-5" />} />
            <KpiCompacto titulo="SLA ≤ 15 min" valor={porcentaje(respuesta?.sla_15?.porcentaje)} detalle={`${entero(respuesta?.sla_15?.total)} respuestas`} icono={<Gauge className="h-5 w-5" />} />
            <KpiCompacto titulo="Sin respuesta humana" valor={entero(respuesta.sin_respuesta)} detalle={`${porcentaje(respuesta.tasa_respuesta)} tasa de respuesta`} icono={<AlertTriangle className="h-5 w-5" />} tone={numero(respuesta.sin_respuesta) > 0 ? "amber" : "green"} />
            <KpiCompacto titulo="Prospectos por día" valor={numero(ritmo.prospectos_dia).toLocaleString("es-MX", { maximumFractionDigits: 1 })} detalle={`${entero(ritmo.dias_transcurridos)} días considerados`} icono={<Activity className="h-5 w-5" />} />
            <KpiCompacto titulo="Proyección de cierre" valor={entero(ritmo.proyeccion_cierre)} detalle={`${MESES[mesSel]} ${añoSel}`} icono={<TrendingUp className="h-5 w-5" />} />
          </div>
        </Seccion>

        <Seccion titulo="Origen, Demanda y Productividad">
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2 2xl:grid-cols-4">
            <GraficoCanalDiario datos={data.canalDiario} loading={loading} />
            <EficienciaCanales canales={canales} loading={loading} />
            <RendimientoAsesores asesores={asesores} loading={loading} />
            <DemandaOrigen lineas={data.lineasNegocio.lineas} pautas={data.pautas} loading={loading} />
          </div>
        </Seccion>

        <Seccion titulo="Perfilamiento y Calidad del Dato" subtitulo="Identifica pérdidas de calidad, descarte y consistencia del registro comercial">
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
            <MotivosDescarte motivos={data.motivos} loading={loading} />
            <CalidadDato calidad={calidad} total={total} loading={loading} />
            <CitasPeriodo citas={data.citas} loading={loading} />
          </div>
        </Seccion>

        <Seccion titulo="Resultado Comercial" subtitulo="Cotización, financiamiento y cierre atribuido a prospectos digitales">
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
            <Cotizaciones data={data.cotizaciones} loading={loading} />
            <Solicitudes data={data.solicitudes} loading={loading} />
            <CierreDigital negocio={negocio} loading={loading} />
          </div>
        </Seccion>
      </main>
    </div>
  );
}

function Filtros({ añoSel, setAñoSel, mesSel, setMesSel, agenciaSel, setAgenciaSel, años, añoActual, mesActual }) {
  return (
    <div className="rounded-xl border border-[#9EA9BD] bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex items-center gap-3">
          <CalendarDays className="h-5 w-5 text-[#131E5C]" />
          <span className="font-black uppercase tracking-[0.08em] text-[#131E5C]">Periodo</span>
          <select value={añoSel} onChange={(e) => { const nuevoAño = Number(e.target.value); setAñoSel(nuevoAño); if (nuevoAño === añoActual && mesSel > mesActual) setMesSel(mesActual); }} className="h-10 rounded-lg border border-[#C8D0DF] bg-[#F7F8FC] px-3 font-bold outline-none focus:border-[#1555C7]">
            {años.map((año) => <option key={año} value={año}>{año}</option>)}
          </select>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => setAgenciaSel(null)} className={`rounded-lg px-4 py-2 font-bold transition ${!agenciaSel ? "bg-[#131E5C] text-white" : "bg-[#EEF2F8] text-[#152754] hover:bg-[#E3E9F3]"}`}>Todas</button>
          {AGENCIAS.map((agencia) => <button key={agencia} type="button" onClick={() => setAgenciaSel(agencia)} className={`rounded-lg px-4 py-2 bg-white border border-[#131E5C] font-bold transition ${agenciaSel === agencia ? "bg-[#131E5C] text-white" : "bg-[#EEF2F8] text-[#152754] hover:bg-[#E3E9F3]"}`}>{agencia}</button>)}
        </div>
      </div>
      <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
        {MESES.map((mes, index) => {
          const futuro = añoSel === añoActual && index > mesActual;
          const active = mesSel === index;
          return <button key={mes} type="button" disabled={futuro} onClick={() => setMesSel(index)} className={`min-w-[92px] flex-1 rounded-lg border border-[#131E5C] px-3 py-2 font-bold transition ${active ? "bg-[#131E5C] text-white shadow" : futuro ? "cursor-not-allowed text-[#AEB6C5]" : " text-[#152754] hover:bg-[#E3E9F3]"}`}>{mes}</button>;
        })}
      </div>
    </div>
  );
}

function Seccion({ titulo, subtitulo, children }) {
  return (
    <section className="relative rounded-xl border border-[#9EA9BD] px-4 pb-4 pt-7 shadow-sm">
      <div className="absolute -top-[14px] left-5 flex max-w-[calc(100%_-_40px)] items-center gap-3 bg-white px-2">
        <h2 className="whitespace-nowrap text-[18px] font-black text-[#07184C]">{titulo}</h2>
        <div className="hidden h-px w-24 bg-[#748199] sm:block" />
      </div>
      {subtitulo && <div className="mb-4 font-medium text-[#67728B]">{subtitulo}</div>}
      {children}
    </section>
  );
}

function Tarjeta({ children, className = "" }) {
  return <div className={`rounded-xl border border-[#B9C4D7] bg-white p-4 shadow-[0_2px_8px_rgba(19,30,92,0.05)] ${className}`}>{children}</div>;
}

function Skeleton({ className = "h-8 w-20" }) {
  return <div className={`animate-pulse rounded-lg bg-[#131E5C]/10 ${className}`} />;
}

function KpiCard({ titulo, valor, badge, badgeTone = "green", detalle, icono, destacado = false, loading }) {
  const tone = { green: "text-[#0A8F61]", red: "bg-[#FDECEC] text-[#D64242]", blue: "bg-[#EAF0FF] text-[#1555C7]" }[badgeTone] || "bg-[#EAF0FF] text-[#1555C7]";
  return (
    <Tarjeta className={destacado ? "bg-gradient-to-br from-[#131E5C] to-[#131E5C] text-white" : ""}>
      <div className="flex items-start justify-between gap-2">
        <div className={`font-black uppercase tracking-[0.08em] ${destacado ? "text-white" : "text-[#1A2344]"}`}>{titulo}</div>
        <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${destacado ? "bg-white/15 text-white" : "bg-[#EAF0FF] text-[#1555C7]"}`}>{icono}</span>
      </div>
      <div className={`mt-6 text-[34px] font-black leading-none ${destacado ? "text-white" : "text-[#07184C]"}`}>{loading ? <Skeleton className="h-9 w-20" /> : valor}</div>
      <div className="mt-4 flex items-center justify-between gap-2 border-t border-current/10 pt-3">
        <span className={`font-semibold ${destacado ? "text-white/80" : "text-[#67728B]"}`}>{detalle}</span>
        {badge && <span className={`shrink-0 rounded-full px-2.5 py-1 font-black ${destacado ? "bg-white/15 text-white" : tone}`}>{loading ? "…" : badge}</span>}
      </div>
    </Tarjeta>
  );
}

function DatoContexto({ titulo, valor, detalle }) {
  return (
    <div className="rounded-lg border border-[#D7DEEA] bg-white px-4 py-3">
      <div className="text-[14px] font-semibold text-[#67728B]">
        {titulo}
      </div>

      <div
        className="mt-1 truncate text-[16px] font-black text-[#07184C]"
        title={String(valor || "")}
      >
        {valor || "Sin datos"}
      </div>

      {detalle && (
        <div className="mt-1 text-[13px] font-medium text-[#8A94A8]">
          {detalle}
        </div>
      )}
    </div>
  );
}
function EmbudoComercial({ etapas = [], loading }) {
  const datos = Array.isArray(etapas) ? etapas : [];

  const colores = [
    "#0B143F",
    "#10205A",
    "#142D76",
    "#183B91",
    "#1C49AC",
    "#2058C6",
    "#2868D5",
    "#3479E0",
    "#438BE8",
  ];

  const anchoInicial = 100;
  const anchoFinal = 36;

  const datosFunnel = datos.map((etapa, index) => {
    const totalEtapas = Math.max(datos.length - 1, 1);

    // Reducción lineal y progresiva.
    // No depende de los valores comerciales.
    const progreso = index / totalEtapas;
    const ancho =
      anchoInicial - (anchoInicial - anchoFinal) * progreso;

    return {
      ...etapa,
      total: numero(etapa.total),
      ancho,
      color: colores[index % colores.length],
    };
  });

  return (
    <Tarjeta>
      <TituloCard
        icono={<Target className="h-5 w-5" />}
        titulo="Embudo Comercial Digital"
      />

      {loading ? (
        <div className="mt-5 flex flex-col items-center gap-1">
          {Array.from({ length: 8 }, (_, index) => {
            const ancho =
              anchoInicial -
              ((anchoInicial - anchoFinal) * index) / 7;

            return (
              <div
                key={index}
                className="h-[62px]"
                style={{ width: `${ancho}%` }}
              >
                <Skeleton className="h-full w-full" />
              </div>
            );
          })}
        </div>
      ) : datosFunnel.length === 0 ? (
        <div className="mt-5">
          <Vacio texto="Sin datos de embudo" />
        </div>
      ) : (
        <>
          <div className="mt-5 grid grid-cols-1 gap-6 2xl:grid-cols-[1.45fr_.75fr]">
            {/* FUNNEL */}
            <div className="flex min-h-[500px] items-start justify-center px-2">
              <div className="flex w-full max-w-[720px] flex-col items-center">
                {datosFunnel.map((etapa, index) => {
                  const siguiente = datosFunnel[index + 1];

                  const anchoInferior = siguiente
                    ? siguiente.ancho
                    : Math.max(etapa.ancho - 7, 24);

                  const relacionInferior =
                    anchoInferior / etapa.ancho;

                  const recorte =
                    ((1 - relacionInferior) / 2) * 100;

                  const conversionOrigen =
                    index === 0
                      ? 100
                      : numero(etapa.conversion_origen);

                  const conversionAnterior =
                    index === 0
                      ? 100
                      : numero(etapa.conversion_anterior);

                  return (
                    <div
                      key={etapa.id || `${etapa.nombre}-${index}`}
                      className="relative -mt-[1px] flex h-[62px] shrink-0 items-center justify-center text-white"
                      style={{
                        width: `${etapa.ancho}%`,
                        backgroundColor: etapa.color,
                        clipPath: `polygon(
                          0% 0%,
                          100% 0%,
                          ${100 - recorte}% 100%,
                          ${recorte}% 100%
                        )`,
                      }}
                    >
                      <div className="flex w-full items-center justify-center gap-5 px-8">
                        <div className="min-w-0 text-center">
                          <div className="truncate text-[14px] font-black uppercase tracking-[0.05em]">
                            {etapa.nombre}
                          </div>

                          <div className="mt-1 text-[12px] font-semibold text-white/80">
                            {index === 0
                              ? "Etapa inicial"
                              : `${porcentaje(
                                conversionAnterior,
                              )} vs. anterior`}
                          </div>
                        </div>

                        <div className="shrink-0 text-center">
                          <div className="text-[24px] font-black leading-none">
                            {entero(etapa.total)}
                          </div>

                          <div className="mt-1 text-[12px] font-bold text-white/85">
                            {porcentaje(conversionOrigen)}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="mt-5 gap-3 border-t border-[#DDE4EE] pt-4">
            <div className="rounded-lg bg-white px-4 py-3">
              <div className="text-[13px] font-semibold text-[#568474]">
                Conversión final
              </div>

              <div className="mt-1 text-[22px] font-black text-[#07835A]">
                {porcentaje(
                  datosFunnel[datosFunnel.length - 1]
                    ?.conversion_origen,
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </Tarjeta>
  );
}
function Oportunidades({ data, loading }) {
  const items = [
    ["Sin respuesta humana", data.sin_respuesta, "Responder y reasignar antes de perder intención"],
    ["Cotización pendiente", data.cotizacion_pendiente, "Prospectos esperando propuesta"],
    ["Solicitud sin resolver", data.solicitud_sin_resolver, "Seguimiento con financiera"],
    ["Aprobados sin facturar", data.aprobados_sin_facturar, "Mayor oportunidad de cierre inmediato"],
    ["Facturados sin entregar", data.facturados_sin_entregar, "Seguimiento de entrega"],
  ];
  return (
    <Tarjeta>
      <TituloCard icono={<AlertTriangle className="h-5 w-5" />} titulo="Oportunidades de acción" />
      <div className="mt-4 space-y-2.5">
        {loading ? Array.from({ length: 5 }, (_, i) => <Skeleton key={i} className="h-16 w-full" />) : items.map(([titulo, valor, detalle]) => (
          <div key={titulo} className="flex items-center gap-3 rounded-lg border border-[#E1E6EF] bg-[#FAFBFD] p-3">
            <div className={`flex h-10 min-w-10 items-center justify-center rounded-lg font-black ${numero(valor) > 0 ? "bg-[#131E5C] text-white" : "bg-[#E5F8EE] text-[#0A8F61]"}`}>{entero(valor)}</div>
            <div className="min-w-0"><div className="font-black text-[#152754]">{titulo}</div><div className="mt-0.5 text-[13px] font-medium text-[#7A859C]">{detalle}</div></div>
          </div>
        ))}
      </div>
    </Tarjeta>
  );
}

function MiniMetrica({ titulo, valor, detalle }) {
  return <div className="rounded-xl border border-[#B9C4D7] bg-white px-4 py-3"><div className="font-semibold text-[#67728B]">{titulo}</div><div className="mt-1 text-[24px] font-black text-[#07184C]">{valor}</div><div className="mt-1 font-medium text-[#8A94A8]">{detalle}</div></div>;
}

function KpiCompacto({ titulo, valor, detalle, icono, tone = "blue" }) {
  const estilos = tone === "amber" ? "bg-[#131E5C] text-white" : tone === "green" ? "bg-[#E5F8EE] text-[#0A8F61]" : "bg-[#EAF0FF] text-[#1555C7]";
  return <Tarjeta><div className="flex items-start justify-between gap-2"><div className="font-black uppercase tracking-[0.06em] text-[#1A2344]">{titulo}</div><span className={`flex h-9 w-9 items-center justify-center rounded-lg ${estilos}`}>{icono}</span></div><div className="mt-5 text-[28px] font-black text-[#07184C]">{valor}</div><div className="mt-2 border-t border-[#E6EAF1] pt-2 font-medium text-[#7A859C]">{detalle}</div></Tarjeta>;
}

function TituloCard({ icono, titulo, detalle }) {
  return <div><div className="flex items-center gap-2"><span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#EAF0FF] text-[#1555C7]">{icono}</span><div className="font-black uppercase tracking-[0.07em] text-[#152754]">{titulo}</div></div>{detalle && <div className="mt-2 font-medium text-[#7A859C]">{detalle}</div>}</div>;
}

function GraficoCanalDiario({ datos, loading }) {
  return (
    <Tarjeta>
      <TituloCard icono={<Activity className="h-5 w-5" />} titulo="Demanda diaria por canal" detalle="Entrada de prospectos durante el mes" />
      <div className="mt-4 h-[300px]">
        {loading ? <Skeleton className="h-full w-full" /> : datos.length === 0 ? <Vacio texto="Sin prospectos en el periodo" /> : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={datos} margin={{ top: 8, right: 8, left: -10, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke="#E7EBF2" />
              <XAxis dataKey="rotulo" tick={{ fontSize: 13, fill: "#738099" }} axisLine={false} tickLine={false} interval={2} />
              <YAxis tick={{ fontSize: 13, fill: "#738099" }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: "rgba(21,39,84,0.04)" }} formatter={(value, name) => [entero(value), name]} />
              <Bar dataKey="whatsapp" name="WhatsApp" stackId="canal" fill={COLOR_CANAL.whatsapp} />
              <Bar dataKey="vw_direct" name="VW Direct" stackId="canal" fill={COLOR_CANAL.vw_direct} />
              <Bar dataKey="facebook" name="Facebook Ads" stackId="canal" fill={COLOR_CANAL.facebook} />
              <Bar dataKey="llamada" name="Llamada" stackId="canal" fill={COLOR_CANAL.llamada} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </Tarjeta>
  );
}

function EficienciaCanales({ canales, loading }) {
  const ordenados = [...(canales || [])].sort((a, b) => numero(b.prospectos) - numero(a.prospectos));
  return (
    <Tarjeta>
      <TituloCard icono={<Gauge className="h-5 w-5" />} titulo="Calidad por canal" detalle="No sólo volumen: cita, descarte y facturación" />
      <div className="mt-4 space-y-3">
        {loading ? Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-16 w-full" />) : ordenados.length === 0 ? <Vacio texto="Sin canales" /> : ordenados.map((c) => (
          <div key={c.nombre} className="rounded-lg border border-[#E1E6EF] p-3">
            <div className="flex items-center justify-between gap-2"><div className="flex min-w-0 items-center gap-2"><span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: COLOR_CANAL[c.id] || "#94A3B8" }} /><span className="truncate font-black text-[#152754]">{c.nombre}</span></div><span className="font-black text-[#07184C]">{entero(c.prospectos)}</span></div>
            <div className="mt-2 grid grid-cols-3 gap-2 text-center"><MetricaLinea label="Cita" value={porcentaje(c.tasa_cita)} /><MetricaLinea label="Descarte" value={porcentaje(c.tasa_descarte)} /><MetricaLinea label="Factura" value={porcentaje(c.tasa_facturacion)} /></div>
          </div>
        ))}
      </div>
    </Tarjeta>
  );
}

function RendimientoAsesores({ asesores, loading }) {
  const top = [...(asesores || [])].slice(0, 6);
  return (
    <Tarjeta>
      <TituloCard icono={<Users className="h-5 w-5" />} titulo="Rendimiento de asesores" detalle="Ordenado por cierres y conversión" />
      <div className="mt-4 space-y-3">
        {loading ? Array.from({ length: 5 }, (_, i) => <Skeleton key={i} className="h-14 w-full" />) : top.length === 0 ? <Vacio texto="Sin asesores asignados" /> : top.map((a, index) => (
          <div key={a.nombre}>
            <div className="flex items-center justify-between gap-3"><div className="min-w-0"><span className="mr-2 font-black text-[#1555C7]">#{index + 1}</span><span className="font-black text-[#152754]">{a.nombre}</span></div><span className="shrink-0 font-black text-[#07184C]">{entero(a.facturados)} fact.</span></div>
            <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-[#EDF1F7]"><div className="h-full rounded-full bg-[#1555C7]" style={{ width: `${Math.min(100, numero(a.tasa_facturacion))}%` }} /></div>
            <div className="mt-1 flex justify-between text-[13px] font-medium text-[#7A859C]"><span>{entero(a.prospectos)} leads · {entero(a.cotizaciones)} cotizaciones</span><span>{porcentaje(a.tasa_facturacion)} cierre</span></div>
          </div>
        ))}
      </div>
    </Tarjeta>
  );
}

function DemandaOrigen({ lineas, pautas, loading }) {
  const topLineas = [...(lineas || [])].sort((a, b) => numero(b.total) - numero(a.total)).slice(0, 3);
  const topPautas = [...(pautas || [])].sort((a, b) => numero(b.total) - numero(a.total)).slice(0, 5);
  return (
    <Tarjeta>
      <TituloCard icono={<TrendingUp className="h-5 w-5" />} titulo="Demanda y campañas" detalle="Qué negocio y pauta están generando intención" />
      <div className="mt-4">
        <div className="font-black text-[#152754]">Líneas de negocio</div>
        <div className="mt-2 space-y-2">{loading ? <Skeleton className="h-24 w-full" /> : topLineas.map((l) => <BarraProgreso key={l.id || l.nombre} label={l.nombre} value={numero(l.porcentaje)} right={`${entero(l.total)} · ${porcentaje(l.porcentaje)}`} />)}</div>
      </div>
      <div className="mt-5 border-t border-[#E5E9F0] pt-4">
        <div className="font-black text-[#152754]">Top pautas</div>
        <div className="mt-2 space-y-2">{loading ? <Skeleton className="h-28 w-full" /> : topPautas.length === 0 ? <Vacio texto="Sin pauta identificada" compact /> : topPautas.map((p) => <BarraProgreso key={`${p.nombre}-${p.canal}`} label={p.nombre} value={numero(p.porcentaje)} right={`${entero(p.total)} · ${porcentaje(p.porcentaje)}`} />)}</div>
      </div>
    </Tarjeta>
  );
}

function MotivosDescarte({ motivos, loading }) {
  const datos = [...(motivos || [])].sort((a, b) => numero(b.total) - numero(a.total)).map((m, i) => ({ ...m, color: COLORES_MOTIVOS[i % COLORES_MOTIVOS.length] }));
  const top = datos.slice(0, 5);
  return (
    <Tarjeta>
      <TituloCard icono={<AlertTriangle className="h-5 w-5" />} titulo="Motivos de descarte" detalle="Dónde se está perdiendo demanda" />
      {loading ? <Skeleton className="mt-4 h-[270px] w-full" /> : top.length === 0 ? <Vacio texto="Sin descartes en el periodo" /> : (
        <div className="mt-4 grid grid-cols-1 items-center gap-4 sm:grid-cols-[170px_1fr] xl:grid-cols-1 2xl:grid-cols-[170px_1fr]">
          <div className="relative mx-auto h-[170px] w-[170px]">
            <ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={top} dataKey="total" nameKey="motivo" innerRadius={52} outerRadius={76} paddingAngle={2} stroke="#fff" strokeWidth={2}>{top.map((d) => <Cell key={d.motivo} fill={d.color} />)}</Pie><Tooltip contentStyle={TOOLTIP_STYLE} formatter={(value, _name, item) => [`${entero(value)} · ${porcentaje(item?.payload?.porcentaje)}`, item?.payload?.motivo]} /></PieChart></ResponsiveContainer>
          </div>
          <div className="space-y-2">{top.map((m) => <div key={m.motivo} className="flex items-center justify-between gap-2"><div className="flex min-w-0 items-center gap-2"><span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: m.color }} /><span className="truncate font-semibold text-[#5F6C84]">{m.motivo}</span></div><span className="shrink-0 font-black text-[#152754]">{porcentaje(m.porcentaje)}</span></div>)}</div>
        </div>
      )}
    </Tarjeta>
  );
}

function CalidadDato({ calidad, total, loading }) {
  const items = [
    ["Asesor asignado", numero(calidad.asignacion_asesor_pct), numero(calidad.sin_asesor)],
    ["Canal identificado", numero(calidad.canal_identificado_pct), numero(calidad.sin_canal)],
    ["Modelo identificado", numero(calidad.modelo_identificado_pct), numero(calidad.sin_modelo)],
    ["Perfil comercial completo", numero(calidad.perfil_completo_pct), numero(calidad.perfil_incompleto)],
  ];
  return (
    <Tarjeta>
      <TituloCard icono={<BadgeCheck className="h-5 w-5" />} titulo="Calidad del registro" detalle="Cobertura de campos clave para analizar y vender" />
      <div className="mt-5 space-y-5">
        {loading ? Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-12 w-full" />) : items.map(([label, pct, faltantes]) => <div key={label}><div className="flex items-center justify-between gap-2"><span className="font-bold text-[#152754]">{label}</span><span className="font-black text-[#07184C]">{porcentaje(pct)}</span></div><div className="mt-2 h-2.5 overflow-hidden rounded-full bg-[#EDF1F7]"><div className="h-full rounded-full bg-gradient-to-r from-[#131E5C] to-[#131E5C]" style={{ width: `${Math.min(100, pct)}%` }} /></div><div className="mt-1 text-[13px] font-medium text-[#7A859C]">{entero(faltantes)} de {entero(total)} requieren completar información</div></div>)}
      </div>
    </Tarjeta>
  );
}

function CitasPeriodo({ citas, loading }) {
  const concertadas = numero(citas.citas_concertadas);
  const efectivas = numero(citas.citas_efectivas);
  const tasa = Math.min(100, Math.max(0, numero(citas.tasa_asistencia)));
  const pie = [{ name: "Asistencia", value: tasa }, { name: "No asistencia", value: Math.max(0, 100 - tasa) }];
  return (
    <Tarjeta>
      <TituloCard icono={<CalendarDays className="h-5 w-5" />} titulo="Citas del periodo" detalle="Actividad operativa por fecha de cita" />
      {loading ? <Skeleton className="mt-4 h-[270px] w-full" /> : (
        <div className="mt-4">
          <div className="relative mx-auto h-[180px] w-[180px]"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={pie} dataKey="value" innerRadius={58} outerRadius={80} startAngle={90} endAngle={-270}><Cell fill="#1555C7" /><Cell fill="#E8ECF3" /></Pie><Tooltip contentStyle={TOOLTIP_STYLE} formatter={(value, name) => [`${value}%`, name]} /></PieChart></ResponsiveContainer><div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center"><div className="text-[30px] font-black text-[#07184C]">{porcentaje(tasa)}</div><div className="font-semibold text-[#7A859C]">asistencia</div></div></div>
          <div className="mt-4 grid grid-cols-2 gap-3"><MetricaCaja label="Concertadas" value={entero(concertadas)} /><MetricaCaja label="Efectivas" value={entero(efectivas)} /></div>
        </div>
      )}
    </Tarjeta>
  );
}

function Cotizaciones({ data, loading }) {
  const total = numero(data?.cotizaciones_activas);
  const efectividad = data?.efectividad || {};
  const modelos = Array.isArray(data?.modelos) ? data.modelos.slice(0, 4) : [];
  return (
    <Tarjeta>
      <TituloCard icono={<FileText className="h-5 w-5" />} titulo="Cotizaciones activas" detalle="Pipeline vigente, sin estados ya terminados" />
      {loading ? <Skeleton className="mt-4 h-[300px] w-full" /> : (
        <div className="mt-4">
          <div className="flex items-end justify-between gap-3"><div><div className="text-[34px] font-black text-[#07184C]">{entero(total)}</div><div className="font-semibold text-[#7A859C]">activas</div></div><div className="text-right"><div className="text-[24px] font-black text-[#1555C7]">{porcentaje(efectividad.porcentaje)}</div><div className="font-semibold text-[#7A859C]">cita efectiva → cotización</div></div></div>
          <div className="mt-5 border-t border-[#E5E9F0] pt-4"><div className="font-black text-[#152754]">Modelos con mayor intención</div><div className="mt-3 space-y-3">{modelos.length === 0 ? <Vacio texto="Sin modelos cotizados" compact /> : modelos.map((m) => <BarraProgreso key={m.modelo} label={m.modelo} value={numero(m.porcentaje)} right={`${entero(m.total)} · ${porcentaje(m.porcentaje)}`} />)}</div></div>
        </div>
      )}
    </Tarjeta>
  );
}

function Solicitudes({ data, loading }) {
  const total = numero(data?.total_folios);
  const aprobadas = numero(data?.solicitudes_aprobadas);
  const dictamen = numero(data?.solicitudes_dictamen);
  const declinadas = numero(data?.solicitudes_declinadas);
  const aprobacion = numero(data?.porcentaje_aprobacion);
  const promedio = data?.promedio_resolucion || {};
  return (
    <Tarjeta>
      <TituloCard icono={<Landmark className="h-5 w-5" />} titulo="Financiamiento" />
      {loading ? <Skeleton className="mt-4 h-[300px] w-full" /> : (
        <div className="mt-4">
          <div className="grid grid-cols-2 gap-3"><MetricaCaja label="Folios" value={entero(total)} /><MetricaCaja label="Aprobados" value={entero(aprobadas)} destacado /></div>
          <div className="mt-3 grid grid-cols-2 gap-3"><MetricaCaja label="En revision" value={entero(dictamen)} /><MetricaCaja label="Declinados" value={entero(declinadas)} /></div>
          <div className="mt-4 rounded-lg bg-[#F7F9FC] p-3"><div className="flex items-center justify-between"><span className="font-bold text-[#5F6C84]">Tasa de aprobación</span><span className="text-[22px] font-black text-[#131E5C]">{porcentaje(aprobacion)}</span></div><div className="mt-2 h-2.5 overflow-hidden rounded-full bg-[#E7EBF2]"><div className="h-full rounded-full bg-[#131E5C]" style={{ width: `${Math.min(100, aprobacion)}%` }} /></div></div>
          <div className="mt-4 border-t border-[#E5E9F0] pt-3"><div className="font-semibold text-[#7A859C]">Tiempo promedio de resolución</div><div className="mt-1 text-[20px] font-black text-[#07184C]">{promedio.texto || "Sin datos"}</div></div>
        </div>
      )}
    </Tarjeta>
  );
}

function CierreDigital({ negocio, loading }) {
  const metricas = negocio.metricas || {};
  const comparativo = negocio.comparativo || {};
  const oportunidades = negocio.oportunidades || {};
  return (
    <Tarjeta>
      <TituloCard icono={<Car className="h-5 w-5" />} titulo="Cierre atribuido digital" />
      {loading ? <Skeleton className="mt-4 h-[300px] w-full" /> : (
        <div className="mt-4">
          <div className="grid grid-cols-2 gap-3"><MetricaCaja label="Facturados" value={entero(negocio.facturados)} destacado /><MetricaCaja label="Entregados" value={entero(negocio.entregados)} /></div>
          <div className="mt-4 rounded-lg bg-gradient-to-r from-[#131E5C] to-[#131E5C] p-4 text-white"><div className="font-semibold text-white/80">Conversión prospecto → factura</div><div className="mt-1 flex items-end justify-between gap-2"><span className="text-[34px] font-black">{porcentaje(metricas.tasa_facturacion)}</span><span className="rounded-full bg-white/15 px-2.5 py-1 font-bold">{badgeVariacion(comparativo.variacion_tasa_facturacion_pp, " pp")}</span></div></div>
          <div className="mt-4 grid grid-cols-2 gap-3"><MetricaCaja label="Aprobados sin facturar" value={entero(oportunidades.aprobados_sin_facturar)} /><MetricaCaja label="Facturados sin entregar" value={entero(oportunidades.facturados_sin_entregar)} /></div>
        </div>
      )}
    </Tarjeta>
  );
}

function MetricaLinea({ label, value }) {
  return <div className="rounded-md bg-[#F5F7FB] px-2 py-1.5"><div className="text-[12px] font-semibold text-[#7A859C]">{label}</div><div className="font-black text-[#152754]">{value}</div></div>;
}

function MetricaCaja({ label, value, destacado = false }) {
  return <div className={`rounded-lg border p-3 ${destacado ? "border-[#A9DCCB] bg-white" : "border-[#E1E6EF] bg-white"}`}><div className="font-semibold text-[#6E7A91]">{label}</div><div className={`mt-1 text-[24px] font-black ${destacado ? "text-[#0A8F61]" : "text-[#07184C]"}`}>{value}</div></div>;
}

function BarraProgreso({ label, value, right }) {
  return <div><div className="flex items-center justify-between gap-2"><span className="min-w-0 truncate font-semibold text-[#5F6C84]" title={label}>{label}</span><span className="shrink-0 font-black text-[#152754]">{right}</span></div><div className="mt-1.5 h-2 overflow-hidden rounded-full bg-[#EDF1F7]"><div className="h-full rounded-full bg-[#1555C7]" style={{ width: `${Math.min(100, Math.max(0, value))}%` }} /></div></div>;
}

function Vacio({ texto, compact = false }) {
  return <div className={`flex items-center justify-center rounded-lg border border-dashed border-[#C9D1DF] font-semibold text-[#8A94A8] ${compact ? "h-16" : "h-full min-h-[180px]"}`}>{texto}</div>;
}
