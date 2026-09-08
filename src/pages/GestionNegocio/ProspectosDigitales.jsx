import { useEffect, useState } from "react";
import { CalendarDays, Car, CheckCircle2, Factory, Truck } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { getLineasNegocio, getMotivosDescarte, getPautasOrigen, getProductividadAsesores, getProspectosStats } from "../../lib/apiProspectosDigitales";

const MESES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
const AGENCIAS = ["VW Córdoba", "VW Orizaba", "VW Poza Rica", "VW Tuxpan", "VW Tuxtepec"];

const ESTADOS_INICIALES = {
  prospectos: { total: 0, crecimiento: 0 },
  descalificados: { total: 0, motivo_principal: "", motivo_total: 0 },
  conversiones_inteligentes: 0,
  citas_concertadas: 0,
  citas_efectivas: 0,
  conversion_total: 0,
};

const DATOS_CANAL_DIARIO = [
  { canal: "WhatsApp VW", corto: "WhatsApp", valor: 0 },
  { canal: "Concesionaria", corto: "Concesionaria", valor: 0 },
  { canal: "Facebook", corto: "Facebook", valor: 0 },
];

const COLOR_CANAL = { "WhatsApp VW": "#25C46A", Concesionaria: "#1555C7", Facebook: "#1877F2" };

const COLOR_CANAL_ID = { whatsapp: "#25C46A", vw_direct: "#1555C7", facebook: "#1877F2" };

const COLOR_CANAL_NEGOCIO = { whatsapp: "#25D6A8", vw_direct: "#131E5C", facebook: "#3B9DF2" };

const COLORES_MOTIVOS = ["#1555C7", "#EF4444", "#F59E0B", "#25D6A8", "#8B5CF6", "#3B9DF2", "#F97316", "#14B8A6", "#64748B", "#EC4899"];

export default function ProspectosDigitales() {
  const añoActual = new Date().getFullYear();
  const años = Array.from({ length: 5 }, (_, i) => añoActual - i);
  const mesActual = new Date().getMonth();

  const [añoSel, setAñoSel] = useState(añoActual);
  const [mesSel, setMesSel] = useState(mesActual);
  const [agenciaSel, setAgenciaSel] = useState(null);
  const [stats, setStats] = useState(ESTADOS_INICIALES);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [productividad, setProductividad] = useState({ asesores: [], canales_totales: [] });
  const [loadingProductividad, setLoadingProductividad] = useState(true);
  const [lineasNegocio, setLineasNegocio] = useState({ demanda_total: 0, canales: [], lineas: [] });
  const [loadingLineas, setLoadingLineas] = useState(true);
  const [pautas, setPautas] = useState([]);
  const [loadingPautas, setLoadingPautas] = useState(true);
  const [motivosDescarte, setMotivosDescarte] = useState([]);
  const [loadingMotivos, setLoadingMotivos] = useState(true);

  useEffect(() => {
    let activo = true;
    setLoading(true);
    setError("");
    getProspectosStats({
      anio: añoSel,
      mes: mesSel + 1,
      agencia: agenciaSel || undefined,
    })
      .then((response) => {
        if (!activo) return;
        setStats({
          prospectos: response?.prospectos ?? ESTADOS_INICIALES.prospectos,
          descalificados: response?.descalificados ?? ESTADOS_INICIALES.descalificados,
          conversiones_inteligentes: Number(response?.conversiones_inteligentes ?? 0),
          citas_concertadas: Number(response?.citas_concertadas ?? 0),
          citas_efectivas: Number(response?.citas_efectivas ?? 0),
          conversion_total: Number(response?.conversion_total ?? 0),
        });
      })
      .catch((err) => {
        if (!activo) return;
        console.error("Error cargando estadísticas de prospectos:", err);
        setError(err?.message || "No fue posible cargar las estadísticas.");
      })
      .finally(() => {
        if (activo) setLoading(false);
      });
    return () => { activo = false; };
  }, [añoSel, mesSel, agenciaSel]);

  useEffect(() => {
    let activo = true;
    setLoadingProductividad(true);
    getProductividadAsesores({
      anio: añoSel,
      mes: mesSel + 1,
      agencia: agenciaSel || undefined,
    })
      .then((response) => {
        if (!activo) return;
        setProductividad({
          asesores: Array.isArray(response?.asesores) ? response.asesores : [],
          canales_totales: Array.isArray(response?.canales_totales) ? response.canales_totales : [],
        });
      })
      .catch((err) => {
        if (!activo) return;
        console.error("Error cargando productividad de asesores:", err);
        setProductividad(null);
      })
      .finally(() => {
        if (activo) setLoadingProductividad(false);
      });
    return () => { activo = false; };
  }, [añoSel, mesSel, agenciaSel]);

  useEffect(() => {
    let activo = true;
    setLoadingLineas(true);
    getLineasNegocio({
      anio: añoSel,
      mes: mesSel + 1,
      agencia: agenciaSel || undefined,
    })
      .then((response) => {
        if (!activo) return;
        setLineasNegocio({
          demanda_total: Number(response?.demanda_total ?? 0),
          canales: Array.isArray(response?.canales) ? response.canales : [],
          lineas: Array.isArray(response?.lineas) ? response.lineas : [],
        });
      })
      .catch((err) => {
        if (!activo) return;
        console.error("Error cargando análisis por línea de negocio:", err);
        setLineasNegocio({ demanda_total: 0, canales: [], lineas: [] });
      })
      .finally(() => {
        if (activo) setLoadingLineas(false);
      });
    return () => { activo = false; };
  }, [añoSel, mesSel, agenciaSel]);

  useEffect(() => {
    let activo = true;
    setLoadingPautas(true);
    getPautasOrigen({
      anio: añoSel,
      mes: mesSel + 1,
      agencia: agenciaSel || undefined,
    })
      .then((response) => {
        if (!activo) return;
        setPautas(Array.isArray(response?.pautas) ? response.pautas : []);
      })
      .catch((err) => {
        if (!activo) return;
        console.error("Error cargando análisis por pauta de origen:", err);
        setPautas([]);
      })
      .finally(() => {
        if (activo) setLoadingPautas(false);
      });
    return () => { activo = false; };
  }, [añoSel, mesSel, agenciaSel]);

  useEffect(() => {
    let activo = true;
    setLoadingMotivos(true);
    getMotivosDescarte({
      anio: añoSel,
      mes: mesSel + 1,
      agencia: agenciaSel || undefined,
    })
      .then((response) => {
        if (!activo) return;
        setMotivosDescarte(Array.isArray(response?.motivos) ? response.motivos : []);
      })
      .catch((err) => {
        if (!activo) return;
        console.error("Error cargando motivos de descarte:", err);
        setMotivosDescarte([]);
      })
      .finally(() => {
        if (activo) setLoadingMotivos(false);
      });
    return () => { activo = false; };
  }, [añoSel, mesSel, agenciaSel]);

  return (
    <div className="min-h-screen">
      <main className="space-y-5 py-4">
        <div className="flex w-full items-center justify-end">
          <div className="relative shrink-0 rounded-2xl border border-[#131E5C]/20 bg-white px-3 pt-3 pb-2 shadow-sm">
            <span className="absolute -top-[9px] left-1/2 -translate-x-1/2 bg-white px-2 text-[11px] font-black uppercase tracking-wider text-[#131E5C]">
              Agencias
            </span>
            <div className="flex flex-wrap items-center gap-1.5">
              {AGENCIAS.map((agencia) => {
                const active = agenciaSel === agencia;
                return (
                  <button
                    key={agencia}
                    type="button"
                    onClick={() => setAgenciaSel(active ? null : agencia)}
                    className={`inline-flex h-8 shrink-0 items-center justify-center rounded-full px-3 text-xs font-bold transition active:scale-[0.97] ${active ? "bg-[#131E5C] text-white shadow-md shadow-[#131E5C]/20" : "bg-[#131E5C]/5 text-[#131E5C] hover:bg-[#131E5C]/10"}`}
                  >
                    {agencia}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto rounded-2xl border border-black/[0.08] bg-white p-3 shadow-md">
          <div className="flex shrink-0 items-center gap-2">
            <CalendarDays className="h-4 w-4 text-[#131E5C]" />
            <select
              value={añoSel}
              onChange={(e) => setAñoSel(Number(e.target.value))}
              className="h-8 w-[76px] rounded-md border border-[#131E5C]/20 bg-[#F7F8FC] px-2 text-xs font-semibold text-[#1A1F3C] outline-none transition focus:border-[#131E5C]/50 focus:ring-2 focus:ring-[#131E5C]/10"
            >
              {años.map((año) => (
                <option key={año} value={año}>{año}</option>
              ))}
            </select>
          </div>

          <div className="flex w-full items-center gap-1.5">
            {MESES.map((mes, i) => {
              const active = mesSel === i;
              return (
                <button
                  key={mes}
                  type="button"
                  onClick={() => setMesSel(i)}
                  className={`flex-1 items-center justify-center rounded-full px-2.5 py-2 text-[11px] font-bold transition active:scale-[0.97] ${active ? "bg-[#131E5C] text-white shadow-md shadow-[#131E5C]/20" : "bg-[#131E5C]/5 text-[#131E5C] hover:bg-[#131E5C]/10"}`}
                >
                  {mes}
                </button>
              );
            })}
          </div>
        </div>

        {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</div>}

        <div className="mx-[14px] mt-[18px] mb-[18px] flex w-full items-stretch gap-[19px] rounded-[12px] bg-[#F8F7FC] p-[18px_14px]">
          <Card1 total={stats.prospectos.total} pct={stats.prospectos.crecimiento} loading={loading} />
          <Descalificados total={stats.descalificados.total} motivo={stats.descalificados.motivo_principal} loading={loading} />
          <ConversionesSmart total={stats.conversiones_inteligentes} loading={loading} />
          <CitasConcertadas total={stats.citas_concertadas} loading={loading} />
          <CitasEfectivas total={stats.citas_efectivas} loading={loading} />
          <ConversionTotal total={`${stats.conversion_total}%`} loading={loading} />
        </div>

        <div className="relative mt-[18px] w-full rounded-[12px] border border-[#131E5C]/20 bg-white px-4 pt-5 pb-4 shadow-sm">
          <span className="absolute -top-[10px] left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-white px-3 text-[12px] font-black uppercase tracking-wider text-[#131E5C]">
            Prospectos Digitales
          </span>
          <div className="mb-4 pt-1 text-center text-[13px] font-semibold text-[#5A627B]">
            Analisis de registro en plataforma interna
          </div>
          <div className="flex w-full items-stretch gap-[19px]">
            <GraficoCanalDiario datos={DATOS_CANAL_DIARIO} />
            <ProductividadAsesores asesores={productividad?.asesores ?? []} canalesTotales={productividad?.canales_totales ?? []} loading={loadingProductividad} />
            <LineasNegocio lineas={lineasNegocio.lineas} canales={lineasNegocio.canales} demandaTotal={lineasNegocio.demanda_total} loading={loadingLineas} />
            <PautasOrigen pautas={pautas} loading={loadingPautas} anio={añoSel} mes={mesSel} />
          </div>
        </div>

        <div className="relative mt-[18px] w-full rounded-[12px] border border-[#131E5C]/20 bg-white px-4 pt-5 pb-4 shadow-sm">
          <span className="absolute -top-[10px] left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-white px-3 text-[12px] font-black uppercase tracking-wider text-[#131E5C]">
            Perfilamiento
          </span>
          <div className="flex w-full items-stretch gap-[19px]">
            <PieMotivosDescarte motivos={motivosDescarte} loading={loadingMotivos} />
            <MotivosPrincipales motivos={motivosDescarte} loading={loadingMotivos} />
          </div>
        </div>
      </main>
    </div>
  );
}

function ValorKPI({ valor, loading }) {
  if (loading) {
    return <div className="h-8 w-16 animate-pulse rounded-lg bg-[#131E5C]/10" />;
  }
  return <span>{valor}</span>;
}

function Card1({ total, pct, loading }) {
  const etiqueta = !loading ? `${pct > 0 ? "+" : ""}${pct}%` : "…";
  return (
    <TarjetaBlanca>
      <div className="flex items-start justify-between gap-2">
        <div className="leading-tight">
          <div className="text-[11px] font-black tracking-wide text-[#152754]">PROSPECTOS</div>
          <div className="text-[11px] font-black tracking-wide text-[#152754]">DIGITALES</div>
        </div>
        <span className="inline-flex h-[31px] w-[64px] shrink-0 items-center justify-center rounded-full bg-[#EAF0FF] text-[12px] font-bold text-[#1555C7]">{etiqueta}</span>
      </div>
      <div className="mt-auto flex items-end justify-between gap-2 pt-[35px]">
        <div className="text-[34px] font-black leading-none tracking-tight text-[#152754]"><ValorKPI valor={total.toLocaleString("es-MX")} loading={loading} /></div>
        <svg width="72" height="36" viewBox="0 0 72 36" className="shrink-0">
          <polyline fill="none" stroke="#1555C7" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
            points="2,32 14,26 26,28 38,18 50,20 62,8 70,5" />
        </svg>
      </div>
      <Linea />
      <div className="mt-2 text-[10px] font-semibold text-[#8891AD]">Prospectos generados en el periodo</div>
    </TarjetaBlanca>
  );
}

function Descalificados({ total, motivo, loading }) {
  const motivoRecortado = motivo ? (motivo.length > 9 ? `${motivo.slice(0, 9)}...` : motivo) : "Sin dato";
  return (
    <TarjetaBlanca>
      <div className="flex items-start justify-between gap-2">
        <div className="leading-tight">
          <div className="text-[11px] font-black tracking-wide text-[#152754]">DESCALIFICADOS</div>
        </div>
        <IconoDescalificado className="h-[35px] w-[35px] shrink-0" />
      </div>
      <div className="mt-auto flex items-end justify-between gap-2 pt-[35px]">
        <div className="text-[34px] font-black leading-none tracking-tight text-[#152754]"><ValorKPI valor={total.toLocaleString("es-MX")} loading={loading} /></div>
      </div>
      <div className="mt-auto border-t border-[#EDF0F7] pt-2" />
      <div className="mt-2 flex items-center justify-between text-[10px]">
        <div className="leading-tight font-semibold text-[#8891AD]">
          <div>Principal</div>
          <div>motivo</div>
        </div>
        <span className="font-bold text-red-500">{loading ? "…" : motivoRecortado}</span>
      </div>
    </TarjetaBlanca>
  );
}

function IconoDescalificado({ className }) {
  return (
    <svg viewBox="0 0 35 35" className={className} fill="none">
      <circle cx="13.5" cy="10.5" r="5.5" stroke="#7B7F87" strokeWidth="1.8" />
      <path d="M2.5 29c0-5 5-8 11-8s11 3 11 8" stroke="#7B7F87" strokeWidth="1.8" strokeLinecap="round" />
      <line x1="6" y1="30" x2="30" y2="6" stroke="#7B7F87" strokeWidth="2.2" strokeLinecap="round" />
      <line x1="6" y1="30" x2="9" y2="33" stroke="#B08968" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}

function ConversionesSmart({ total, loading }) {
  return (
    <TarjetaBlanca>
      <div className="flex items-start justify-between gap-2">
        <div className="leading-tight">
          <div className="text-[11px] font-black tracking-wide text-[#152754]">CONV.</div>
          <div className="text-[11px] font-black tracking-wide text-[#152754]">INTELIGENTES</div>
        </div>
        <span className="flex h-[47px] w-[52px] shrink-0 flex-col items-center justify-center rounded-full bg-[#EAF0FF] text-[11px] font-bold leading-none text-[#1555C7]">
          <span>Bot</span>
          <span>VW</span>
        </span>
      </div>
      <div className="mt-auto flex items-end justify-between gap-2 pt-[35px]">
        <div className="text-[34px] font-black leading-none tracking-tight text-[#152754]"><ValorKPI valor={total.toLocaleString("es-MX")} loading={loading} /></div>
        <IconoRobot className="h-[35px] w-[35px] shrink-0" />
      </div>
      <Linea />
      <div className="mt-2 text-[10px] font-semibold text-[#8891AD]">Conversaciones inteligentes (Bot VW)</div>
    </TarjetaBlanca>
  );
}

function IconoRobot({ className }) {
  return (
    <svg viewBox="0 0 35 35" className={className} fill="none">
      <line x1="15" y1="2" x2="15" y2="6" stroke="#255BC7" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="15" cy="2.2" r="1.8" stroke="#255BC7" strokeWidth="1.6" />
      <rect x="7" y="8" width="21" height="17" rx="5" stroke="#255BC7" strokeWidth="1.8" />
      <line x1="4" y1="11" x2="7" y2="13" stroke="#255BC7" strokeWidth="1.8" strokeLinecap="round" />
      <line x1="31" y1="11" x2="28" y2="13" stroke="#255BC7" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="13" cy="16" r="1.4" fill="#255BC7" />
      <circle cx="22" cy="16" r="1.4" fill="#255BC7" />
      <path d="M13 22h9" stroke="#255BC7" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function CitasConcertadas({ total, loading }) {
  return (
    <TarjetaBlanca>
      <div className="flex items-start justify-between gap-2">
        <div className="leading-tight">
          <div className="text-[11px] font-black tracking-wide text-[#152754]">CITAS</div>
          <div className="text-[11px] font-black tracking-wide text-[#152754]">CONCERTADAS</div>
        </div>
        <span className="inline-flex h-[31px] w-[70px] shrink-0 items-center justify-center rounded-full bg-[#EEF0FF] text-[11px] font-bold text-[#273B74]">Agenda</span>
      </div>
      <div className="mt-auto flex items-end justify-between gap-2 pt-[35px]">
        <div className="text-[34px] font-black leading-none tracking-tight text-[#152754]"><ValorKPI valor={total.toLocaleString("es-MX")} loading={loading} /></div>
        <IconoCalendarioCheck className="h-[34px] w-[34px] shrink-0" />
      </div>
      <Linea />
      <div className="mt-2 text-[10px] font-semibold text-[#8891AD]">Citas agendadas en el periodo</div>
    </TarjetaBlanca>
  );
}

function IconoCalendarioCheck({ className }) {
  return (
    <svg viewBox="0 0 34 34" className={className} fill="none">
      <rect x="4" y="6" width="26" height="24" rx="3.5" stroke="#255BC7" strokeWidth="1.8" />
      <line x1="4" y1="12" x2="30" y2="12" stroke="#255BC7" strokeWidth="1.8" />
      <line x1="11" y1="2.5" x2="11" y2="8" stroke="#255BC7" strokeWidth="1.8" strokeLinecap="round" />
      <line x1="23" y1="2.5" x2="23" y2="8" stroke="#255BC7" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M11 21l4.5 4.5L23 18" stroke="#255BC7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CitasEfectivas({ total, loading }) {
  return (
    <TarjetaBlanca>
      <div className="flex items-start justify-between gap-2">
        <div className="leading-tight">
          <div className="text-[11px] font-black tracking-wide text-[#152754]">CITAS</div>
          <div className="text-[11px] font-black tracking-wide text-[#152754]">EFECTIVAS</div>
        </div>
        <span className="flex h-[47px] w-[69px] shrink-0 flex-col items-center justify-center rounded-full bg-[#E7E9FF] text-[11px] font-bold leading-none text-[#66718C]">
          <span>En</span>
          <span>espera</span>
        </span>
      </div>
      <div className="mt-auto flex items-end justify-between gap-2 pt-[35px]">
        <div className="text-[34px] font-black leading-none tracking-tight text-[#152754]"><ValorKPI valor={total.toLocaleString("es-MX")} loading={loading} /></div>
        <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#E7E9FF] text-[#66718C]">
          <CheckCircle2 className="h-5 w-5" />
        </span>
      </div>
      <Linea />
      <div className="mt-2 text-[10px] font-semibold text-[#8891AD]">Citas efectivas en el periodo</div>
    </TarjetaBlanca>
  );
}

function ConversionTotal({ total, loading }) {
  return (
    <div className="flex min-w-0 flex-1 flex-col rounded-[12px] bg-gradient-to-br from-[#082763] to-[#3868C9] p-4 shadow-[0_2px_5px_rgba(21,39,84,0.08)]">
      <div className="flex items-start justify-between gap-2">
        <div className="text-[14px] font-bold leading-tight text-white">
          <div>CONVERSIÓN</div>
          <div>TOTAL</div>
        </div>
        <IconoTendencia className="h-[25px] w-[25px] shrink-0" />
      </div>
      <div className="mt-auto flex flex-col items-start pt-[35px]">
        <div className="text-[55px] font-bold leading-none tracking-tight text-white">{loading ? <span className="inline-block h-12 w-20 animate-pulse rounded-lg bg-white/20" /> : total}</div>
        <div className="mt-2 text-[15px] font-semibold text-white">Prospectos a Citas</div>
      </div>
    </div>
  );
}

function IconoTendencia({ className }) {
  return (
    <svg viewBox="0 0 25 25" className={className} fill="none">
      <polyline points="1,22 7,16 11,19 17,10 21,13 24,6" stroke="#CFE0FF" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <line x1="24" y1="6" x2="18" y2="6" stroke="#CFE0FF" strokeWidth="1.8" strokeLinecap="round" />
      <line x1="24" y1="6" x2="24" y2="12" stroke="#CFE0FF" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function GraficoCanalDiario({ datos }) {
  return (
    <div className="flex min-w-0 flex-1 flex-col rounded-[12px] bg-white p-4 shadow-[0_2px_5px_rgba(21,39,84,0.08)]">
      <div className="leading-tight">
        <div className="text-[12px] font-bold tracking-wide text-[#152754]">ANALISIS DIARIO</div>
        <div className="text-[12px] font-bold tracking-wide text-[#152754]">POR CANAL</div>
      </div>
      <div className="mt-3 h-[150px] min-h-[150px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={datos} margin={{ top: 5, right: 5, left: -22, bottom: 0 }}>
            <XAxis dataKey="corto" tick={{ fontSize: 9, fill: "#8891AD" }} axisLine={false} tickLine={false} interval={0} />
            <YAxis tick={{ fontSize: 9, fill: "#8891AD" }} axisLine={false} tickLine={false} allowDecimals={false} />
            <Tooltip
              cursor={{ fill: "rgba(21,39,84,0.04)" }}
              contentStyle={{ borderRadius: 12, border: "1px solid #E4E7F0", boxShadow: "0 8px 24px rgba(19,30,92,.10)", fontSize: 12 }}
              formatter={(value, name, entry) => [Number(value).toLocaleString("es-MX"), entry?.payload?.canal]}
            />
            <Bar dataKey="valor" radius={[5, 5, 0, 0]} barSize={28}>
              {datos.map((d) => (
                <Cell key={d.canal} fill={COLOR_CANAL[d.canal] || "#1555C7"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function ProductividadAsesores({ asesores, canalesTotales, loading }) {
  const canales = [
    { id: "whatsapp", nombre: "WhatsApp" },
    { id: "vw_direct", nombre: "VW Directo" },
    { id: "facebook", nombre: "Facebook" },
  ];

  return (
    <div className="flex min-w-0 flex-1 flex-col rounded-[12px] bg-white p-4 shadow-[0_2px_5px_rgba(21,39,84,0.08)]">
      <div className="leading-tight">
        <div className="text-[12px] font-bold tracking-wide text-[#152754]">PRODUCTIVIDAD</div>
        <div className="text-[12px] font-bold tracking-wide text-[#152754]">COMPARADA DE ASESORES</div>
      </div>
      {canalesTotales.length > 0 && (
        <div className="mt-3 flex gap-1.5">
          {canalesTotales.map((c) => (
            <span
              key={c.id}
              className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-[9px] font-bold"
              style={{ backgroundColor: `${COLOR_CANAL_ID[c.id] || "#1555C7"}18`, color: COLOR_CANAL_ID[c.id] || "#1555C7" }}
            >
              <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: COLOR_CANAL_ID[c.id] || "#1555C7" }} />
              {c.nombre} {Number(c.total || 0).toLocaleString("es-MX")}
            </span>
          ))}
        </div>
      )}
      <div className="mt-3 h-[150px] min-h-[150px] overflow-x-auto overflow-y-hidden">
        {loading ? (
          <div className="flex h-[150px] items-center justify-center gap-2">
            <div className="h-24 w-28 animate-pulse rounded-[8px] bg-[#131E5C]/10" />
            <div className="h-24 w-28 animate-pulse rounded-[8px] bg-[#131E5C]/10" />
          </div>
        ) : asesores.length === 0 ? (
          <div className="flex h-[150px] items-center justify-center rounded-[8px] border border-dashed border-[#131E5C]/15 text-[10px] font-semibold text-[#8891AD]">
            Sin datos en el periodo
          </div>
        ) : (
          <div className="flex h-full gap-2">
            {asesores.map((asesor) => (
              <TarjetaAsesor key={asesor.nombre} asesor={asesor} canales={canales} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function TarjetaAsesor({ asesor, canales }) {
  const total = Number(asesor.total_leads || 0);
  return (
    <div className="flex min-w-[130px] max-w-[130px] flex-col rounded-[10px] border border-[#131E5C]/10 bg-white p-2.5">
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#131E5C] text-[11px] font-black text-white">
          {asesor.iniciales || "?"}
        </div>
        <div className="min-w-0 leading-tight">
          <div className="truncate text-[10px] font-bold text-[#152754]">{asesor.nombre}</div>
          <div className="truncate text-[9px] font-semibold text-[#8891AD]">{asesor.puesto || asesor.tipo_asesor || "Asesor digital"}</div>
        </div>
      </div>
      <div className="mt-2 flex items-baseline gap-1">
        <span className="text-[18px] font-black leading-none text-[#152754]">{total.toLocaleString("es-MX")}</span>
        <span className="text-[9px] font-semibold text-[#8891AD]">leads</span>
      </div>
      <div className="mt-2 flex flex-col gap-1.5">
        {canales.map((canal) => {
          const dato = asesor.canales?.find((c) => c.id === canal.id) || { total: 0, porcentaje: 0 };
          const color = COLOR_CANAL_ID[canal.id] || "#1555C7";
          return (
            <div key={canal.id}>
              <div className="flex items-center justify-between text-[8px] font-semibold text-[#8891AD]">
                <span>{canal.nombre}</span>
                <span className="font-bold text-[#152754]">{Number(dato.total || 0).toLocaleString("es-MX")} ({dato.porcentaje ?? 0}%)</span>
              </div>
              <div className="mt-0.5 h-1.5 w-full overflow-hidden rounded-full bg-[#EDF0F7]">
                <div className="h-full rounded-full" style={{ width: `${Math.min(100, Number(dato.porcentaje || 0))}%`, backgroundColor: color }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function LineasNegocio({ lineas, canales, demandaTotal, loading }) {
  const iconos = {
    nuevos: <Factory className="h-5 w-5" />,
    usados: <Car className="h-5 w-5" />,
    sin_clasificar: <Truck className="h-5 w-5" />,
  };
  const colores = {
    nuevos: "#131E5C",
    usados: "#1555C7",
    sin_clasificar: "#8891AD",
  };

  return (
    <div className="flex min-w-0 flex-1 flex-col rounded-[12px] bg-white p-4 shadow-[0_2px_5px_rgba(21,39,84,0.08)]">
      <div className="leading-tight">
        <div className="text-[12px] font-bold tracking-wide text-[#152754]">ANALISIS POR LINEA</div>
        <div className="text-[12px] font-bold tracking-wide text-[#152754]">DE NEGOCIOS</div>
      </div>

      {loading ? (
        <div className="mt-3 flex h-[150px] items-center justify-center gap-2">
          <div className="h-24 w-28 animate-pulse rounded-[8px] bg-[#131E5C]/10" />
          <div className="h-24 w-28 animate-pulse rounded-[8px] bg-[#131E5C]/10" />
        </div>
      ) : lineas.length === 0 ? (
        <div className="mt-3 flex h-[150px] items-center justify-center rounded-[8px] border border-dashed border-[#131E5C]/15 text-[10px] font-semibold text-[#8891AD]">
          Sin datos en el periodo
        </div>
      ) : (
        <>
          <div className="mt-3 flex gap-1.5">
            {canales.map((c) => {
              const color = COLOR_CANAL_NEGOCIO[c.id] || "#8891AD";
              const total = Number(c.total ?? 0);
              return (
                <div key={c.id} className="flex min-w-0 flex-1 flex-col items-center rounded-[8px] bg-[#F8F7FC] px-1 py-1.5">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
                  <span className="mt-1 text-[8px] font-bold leading-none text-[#8891AD] truncate">{c.nombre.split("/")[0]}</span>
                  <span className="text-[9px] font-black leading-tight text-[#152754]">{total.toLocaleString("es-MX")}</span>
                </div>
              );
            })}
          </div>

          <div className="mt-2 flex flex-col gap-1.5">
            {lineas.map((linea) => {
              const color = colores[linea.id] || "#131E5C";
              const pct = Number(linea.porcentaje ?? 0);
              return (
                <div key={linea.id} className="rounded-[8px] border border-[#131E5C]/10 bg-white p-2">
                  <div className="flex items-center gap-2">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-white" style={{ backgroundColor: color }}>
                      {iconos[linea.id]}
                    </span>
                    <div className="min-w-0 flex-1 leading-tight">
                      <div className="truncate text-[9px] font-bold text-[#152754]">{linea.nombre}</div>
                      <div className="truncate text-[8px] font-semibold text-[#8891AD]">
                        {Number(linea.total ?? 0).toLocaleString("es-MX")} leads · {pct.toLocaleString("es-MX")}%
                      </div>
                    </div>
                    <span className="shrink-0 text-[10px] font-black text-[#152754]">{pct}%</span>
                  </div>
                  <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-[#EDF0F7]">
                    <div className={`h-full rounded-full ${demandaTotal > 0 ? "" : "bg-none"}`} style={{ width: `${pct}%`, backgroundColor: demandaTotal > 0 ? color : "#EDF0F7" }} />
                  </div>
                  {linea.items?.length > 0 && (
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {linea.items.map((item) => (
                        <span key={item.nombre} className="rounded-full bg-[#F0F2FA] px-2 py-0.5 text-[8px] font-semibold text-[#5A627B]">
                          {item.nombre}
                          <b className="ml-1 text-[#152754]">{Number(item.total ?? 0).toLocaleString("es-MX")}</b>
                        </span>
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

function PautasOrigen({ pautas, loading, anio, mes }) {
  const mesNombre = MESES[mes] || "";
  return (
    <div className="flex min-w-0 flex-1 flex-col rounded-[12px] bg-white p-4 shadow-[0_2px_5px_rgba(21,39,84,0.08)]">
      <div className="leading-tight">
        <div className="text-[12px] font-bold tracking-wide text-[#152754]">POR PAUTA</div>
        <div className="text-[12px] font-bold tracking-wide text-[#152754]">DE ORIGEN</div>
      </div>
      <div className="mt-3 h-[150px] min-h-[150px]">
        {loading ? (
          <div className="flex h-[150px] items-center justify-center gap-2">
            <div className="h-20 w-28 animate-pulse rounded-[8px] bg-[#131E5C]/10" />
            <div className="h-20 w-28 animate-pulse rounded-[8px] bg-[#131E5C]/10" />
          </div>
        ) : pautas.length === 0 ? (
          <div className="flex h-[150px] items-center justify-center rounded-[8px] border border-dashed border-[#131E5C]/15 text-[10px] font-semibold text-[#8891AD]">
            Sin datos en el periodo
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={pautas} layout="vertical" margin={{ top: 0, right: 40, left: 0, bottom: 0 }} barCategoryGap={3}>
              <CartesianGrid horizontal={false} stroke="#EDF0F7" />
              <XAxis type="number" domain={[0, "dataMax"]} tick={{ fontSize: 9, fill: "#8891AD" }} axisLine={false} tickLine={false} allowDecimals={false} />
              <YAxis type="category" dataKey="nombre" width={86} tick={{ fontSize: 8, fill: "#5A627B" }} axisLine={false} tickLine={false} interval={0} />
              <Tooltip
                cursor={{ fill: "rgba(21,39,84,0.04)" }}
                contentStyle={{ borderRadius: 12, border: "1px solid #E4E7F0", boxShadow: "0 8px 24px rgba(19,30,92,.10)", fontSize: 11 }}
                formatter={(value, name, entry) => {
                  const item = pautas[entry?.index] || {};
                  return [`${Number(value).toLocaleString("es-MX")} leads (${Number(item.porcentaje ?? 0).toLocaleString("es-MX")}% de participación)`, "Total"];
                }}
                labelFormatter={(_, payload) => {
                  const item = payload?.[0]?.payload;
                  if (!item) return "";
                  return (
                    <div className="flex flex-col gap-0.5 py-0.5">
                      <span className="font-bold text-[#152754]">{item.nombre}</span>
                      <span className="text-[#5A627B]">Canal: {item.canal}</span>
                      <span className="text-[#5A627B]">Periodo: {mesNombre} {anio}</span>
                    </div>
                  );
                }}
              />
              <Bar dataKey="total" fill="#1555C7" radius={[0, 5, 5, 0]} barSize={22} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

function PieMotivosDescarte({ motivos, loading }) {
  const datos = motivos.map((m, i) => ({ ...m, color: COLORES_MOTIVOS[i % COLORES_MOTIVOS.length] }));
  return (
    <div className="flex min-w-0 flex-1 flex-col rounded-[12px] bg-white p-4 shadow-[0_2px_5px_rgba(21,39,84,0.08)]">
      <div className="text-[12px] font-bold tracking-wide text-[#152754]">MOTIVOS DE DESCARTE</div>
      {loading ? (
        <div className="flex h-[220px] items-center justify-center gap-4">
          <div className="h-36 w-36 animate-pulse rounded-full bg-[#131E5C]/10" />
          <div className="h-20 w-28 animate-pulse rounded-lg bg-[#131E5C]/10" />
        </div>
      ) : motivos.length === 0 ? (
        <div className="flex h-[220px] items-center justify-center rounded-[8px] border border-dashed border-[#131E5C]/15 text-[10px] font-semibold text-[#8891AD]">
          Sin descartes en el periodo
        </div>
      ) : (
        <div className="mt-2 flex min-h-[220px] items-center justify-center gap-4">
          <div className="h-[180px] w-[180px] shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={datos} dataKey="total" nameKey="motivo" cx="50%" cy="50%" innerRadius={52} outerRadius={82} paddingAngle={2}>
                  {datos.map((d) => (
                    <Cell key={d.motivo} fill={d.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ borderRadius: 12, border: "1px solid #E4E7F0", boxShadow: "0 8px 24px rgba(19,30,92,.10)", fontSize: 11 }}
                  formatter={(value, name, entry) => {
                    const item = datos[entry?.index] || {};
                    return [`${Number(value).toLocaleString("es-MX")} leads (${Number(item.porcentaje ?? 0).toLocaleString("es-MX")}%)`, "Total"];
                  }}
                  labelFormatter={(_, payload) => {
                    const item = payload?.[0]?.payload;
                    return item?.motivo || "";
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex min-w-0 flex-1 flex-col gap-1.5">
            {datos.slice(0, 5).map((d) => (
              <div key={d.motivo} className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: d.color }} />
                <span className="min-w-0 flex-1 truncate text-[9px] font-semibold text-[#5A627B]">{d.motivo}</span>
                <span className="shrink-0 text-[9px] font-black text-[#152754]">{Number(d.porcentaje ?? 0).toLocaleString("es-MX")}%</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function MotivosPrincipales({ motivos, loading }) {
  const principales = [...(motivos || [])].sort((a, b) => (b.total ?? 0) - (a.total ?? 0)).slice(0, 2);
  return (
    <div className="flex min-w-0 flex-1 flex-col rounded-[12px] bg-white p-4 shadow-[0_2px_5px_rgba(21,39,84,0.08)]">
      <div className="text-[12px] font-bold tracking-wide text-[#152754]">PRINCIPALES MOTIVOS DE DESCARTE</div>
      {loading ? (
        <div className="mt-3 flex h-[220px] flex-col gap-2">
          <div className="h-24 animate-pulse rounded-xl bg-[#131E5C]/10" />
          <div className="h-24 animate-pulse rounded-xl bg-[#131E5C]/10" />
        </div>
      ) : principales.length === 0 ? (
        <div className="mt-3 flex h-[220px] items-center justify-center rounded-[8px] border border-dashed border-[#131E5C]/15 text-[10px] font-semibold text-[#8891AD]">
          Sin descartes en el periodo
        </div>
      ) : (
        <div className="mt-3 flex flex-col gap-2.5">
          {principales.map((m) => {
            const color = COLORES_MOTIVOS[(motivos || []).indexOf(m) % COLORES_MOTIVOS.length];
            return (
              <div key={m.motivo} className="rounded-[12px] border border-[#131E5C]/10 bg-[#F8F7FC] p-3.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: color }} />
                  <div className="min-w-0 flex-1 leading-tight">
                    <div className="truncate text-[11px] font-bold text-[#152754]">{m.motivo}</div>
                    <div className="text-[10px] font-semibold text-[#8891AD]">Leads descartados</div>
                  </div>
                  <span className="shrink-0 text-[20px] font-black leading-none text-[#152754]">{Number(m.porcentaje ?? 0).toLocaleString("es-MX")}%</span>
                </div>
                <div className="mt-2 flex items-end justify-between gap-2">
                  <div className="text-[26px] font-black leading-none text-[#152754]">{Number(m.total ?? 0).toLocaleString("es-MX")}</div>
                  <div className="h-2 w-full max-w-[60%] overflow-hidden rounded-full bg-[#EDF0F7]">
                    <div className="h-full rounded-full" style={{ width: `${Math.min(100, Number(m.porcentaje ?? 0))}%`, backgroundColor: color }} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function TarjetaBlanca({ children }) {
  return (
    <div className="flex min-w-0 flex-1 flex-col rounded-[12px] bg-white p-4 shadow-[0_2px_5px_rgba(21,39,84,0.08)]">
      {children}
    </div>
  );
}

function Linea() {
  return <div className="mt-auto border-t border-[#EDF0F7] pt-2" />;
}
