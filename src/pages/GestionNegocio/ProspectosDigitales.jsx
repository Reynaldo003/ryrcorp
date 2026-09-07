import { useEffect, useState } from "react";
import { CalendarDays, CheckCircle2 } from "lucide-react";
import { getProspectosStats } from "../../lib/apiProspectosDigitales";

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

  return (
    <div className="min-h-screen">
      <main className="space-y-5 py-4">
        <div className="flex w-full flex-wrap items-center justify-between gap-3">
          <h1 className="text-xl font-extrabold text-[#131E5C]">Prospectos Digitales</h1>
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
